import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PET_COLLECTION, getRandomPetDrop, RARITY_CONFIG } from '../data/pets';
import { useAuth } from './AuthContext';
import { api } from '../services';

/**
 * Gamification Context
 *
 * Manages the gamification state including:
 * - User's pet collection
 * - Blind boxes earned and available
 * - Running goals and rewards
 * - Current active companion
 */

const GamificationContext = createContext();

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

// Get user-specific storage keys
const getUserStorageKeys = (userId) => {
  const userSuffix = userId || 'default';
  return {
    USER_PETS: `@gamification_user_pets_${userSuffix}`,
    BLIND_BOXES: `@gamification_blind_boxes_${userSuffix}`,
    ACTIVE_COMPANION: `@gamification_active_companion_${userSuffix}`,
    RUNNING_GOALS: `@gamification_running_goals_${userSuffix}`,
    ACHIEVEMENT_HISTORY: `@gamification_achievements_${userSuffix}`,
    TOTAL_RUN_DISTANCE: `@gamification_total_run_distance_${userSuffix}`,
    TOTAL_BOXES_EARNED: `@gamification_total_boxes_earned_${userSuffix}`
  };
};

// Default meters per blind box (5km) - used as fallback
const DEFAULT_METERS_PER_BLIND_BOX = 5000;

export const GamificationProvider = ({ children }) => {
  const { user, token, refreshUser } = useAuth(); // Get user data, token, and refresh function from AuthContext
  const [userPets, setUserPets] = useState([]); // Array of pet IDs user owns
  const [blindBoxes, setBlindBoxes] = useState(0); // Number of unopened blind boxes
  const [activeCompanion, setActiveCompanion] = useState(null); // Currently selected pet
  const [totalRunDistance, setTotalRunDistance] = useState(0); // Total distance run in meters (across all dates)
  const [metersPerBlindBox, setMetersPerBlindBox] = useState(DEFAULT_METERS_PER_BLIND_BOX); // User's custom goal
  const [runningGoals, setRunningGoals] = useState({
    daily: { distance: 5000, completed: false }, // 5km daily goal
    weekly: { distance: 25000, completed: false }, // 25km weekly goal
    achievements: []
  });
  const [achievementHistory, setAchievementHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from storage on app start or when user changes
  useEffect(() => {
    if (user) {
      loadGamificationData();
    } else {
      // Reset gamification data when logged out
      setUserPets([]);
      setBlindBoxes(0);
      setActiveCompanion(null);
      setTotalRunDistance(0);
      setRunningGoals({
        daily: { distance: 5000, completed: false },
        weekly: { distance: 25000, completed: false },
        achievements: []
      });
      setAchievementHistory([]);
    }
  }, [user?.uid]);

  // Update metersPerBlindBox when user data changes
  useEffect(() => {
    if (user && user.petRewardGoal) {
      // Convert km to meters
      const metersGoal = user.petRewardGoal * 1000;
      setMetersPerBlindBox(metersGoal);
      console.log(`✅ User's blind box goal set to: ${user.petRewardGoal}km (${metersGoal}m)`);
    } else {
      // Use default if user hasn't set a goal
      setMetersPerBlindBox(DEFAULT_METERS_PER_BLIND_BOX);
      console.log(`ℹ️ Using default blind box goal: ${DEFAULT_METERS_PER_BLIND_BOX / 1000}km`);
    }
  }, [user]);

  // Sync total running distance and pet collection from backend when user logs in
  useEffect(() => {
    if (token && user) {
      syncPetCollectionFromBackend();
    }
  }, [token, user]);

  // Sync total distance after metersPerBlindBox is updated
  useEffect(() => {
    if (token && user && metersPerBlindBox > 0) {
      syncTotalDistanceFromBackend();
    }
  }, [token, user, metersPerBlindBox]);

  // Listen for app state changes and refresh user data when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && token && refreshUser) {
        console.log('📱 App became active, refreshing user data...');
        try {
          await refreshUser();
        } catch (error) {
          console.error('❌ Failed to refresh user data on app resume:', error);
        }
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [token, refreshUser]);

  const loadGamificationData = async () => {
    try {
      setIsLoading(true);

      const KEYS = getUserStorageKeys(user?.uid);
      const [
        storedPets,
        storedBoxes,
        storedCompanion,
        storedGoals,
        storedAchievements,
        storedDistance
      ] = await Promise.all([
        AsyncStorage.getItem(KEYS.USER_PETS),
        AsyncStorage.getItem(KEYS.BLIND_BOXES),
        AsyncStorage.getItem(KEYS.ACTIVE_COMPANION),
        AsyncStorage.getItem(KEYS.RUNNING_GOALS),
        AsyncStorage.getItem(KEYS.ACHIEVEMENT_HISTORY),
        AsyncStorage.getItem(KEYS.TOTAL_RUN_DISTANCE)
      ]);

      if (storedPets) setUserPets(JSON.parse(storedPets));
      if (storedBoxes) setBlindBoxes(parseInt(storedBoxes));
      if (storedCompanion) setActiveCompanion(JSON.parse(storedCompanion));
      if (storedGoals) setRunningGoals(JSON.parse(storedGoals));
      if (storedAchievements) setAchievementHistory(JSON.parse(storedAchievements));
      if (storedDistance) setTotalRunDistance(parseInt(storedDistance));

      // Give starter pet if no pets owned or no active companion
      if (!storedPets || JSON.parse(storedPets).length === 0) {
        await giveStarterPet();
      } else if (!storedCompanion) {
        // If user has pets but no active companion, set Pikachu as default
        const pikachu = PET_COLLECTION.find(pet => pet.name === 'Pikachu');
        if (pikachu) {
          setActiveCompanion({ ...pikachu, isStarterPet: true });
        }
      }

    } catch (error) {
      console.error('Failed to load gamification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToStorage = async (keyName, data) => {
    try {
      // keyName should be one of: 'USER_PETS', 'BLIND_BOXES', etc.
      // We'll get the user-specific key from getUserStorageKeys
      const KEYS = getUserStorageKeys(user?.uid);
      const actualKey = KEYS[keyName] || keyName; // fallback to keyName if not found
      await AsyncStorage.setItem(actualKey, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save ${keyName}:`, error);
    }
  };

  // Sync total running distance from backend
  const syncTotalDistanceFromBackend = async () => {
    if (!token) return;
    
    try {
      console.log('🔄 Syncing total running distance from backend...');
      
      // Get all workouts from backend
      const response = await api.getWorkouts(token);
      
      if (response && response.workouts) {
        // Calculate total distance from all workouts
        const totalDistance = response.workouts.reduce((sum, workout) => {
          return sum + (workout.distance_meters || 0);
        }, 0);
        
        console.log(`✅ Total distance from backend: ${totalDistance}m (${(totalDistance / 1000).toFixed(2)}km)`);
        console.log(`📊 Total workouts: ${response.workouts.length}`);
        
        // Update state and storage
        setTotalRunDistance(totalDistance);
        await saveToStorage('TOTAL_RUN_DISTANCE', totalDistance);
        
        // Check if any new blind boxes should be awarded
        console.log(`🎯 Blind box calculation debug:`);
        console.log(`  - Total distance: ${totalDistance}m`);
        console.log(`  - User's petRewardGoal: ${user?.petRewardGoal}km`);
        console.log(`  - metersPerBlindBox: ${metersPerBlindBox}m`);
        console.log(`  - Expected boxes: ${Math.floor(totalDistance / metersPerBlindBox)}`);
        
        const totalBoxesEarned = Math.floor(totalDistance / metersPerBlindBox);
        const KEYS = getUserStorageKeys(user?.uid);
        const storedBoxes = await AsyncStorage.getItem(KEYS.BLIND_BOXES);
        const currentUnopened = storedBoxes ? parseInt(storedBoxes) : 0;
        
        // Calculate how many boxes user has earned in total vs local tracking
        // We need to track "total boxes earned" separately to avoid losing unopened boxes
        const storedTotalEarned = await AsyncStorage.getItem(KEYS.TOTAL_BOXES_EARNED);
        const previousTotalEarned = storedTotalEarned ? parseInt(storedTotalEarned) : 0;
        
        console.log(`📊 Blind box tracking:`);
        console.log(`  - Previous total earned: ${previousTotalEarned}`);
        console.log(`  - New total earned: ${totalBoxesEarned}`);
        console.log(`  - Current unopened: ${currentUnopened}`);
        
        // If backend shows user earned more boxes in total
        if (totalBoxesEarned > previousTotalEarned) {
          const newBoxes = totalBoxesEarned - previousTotalEarned;
          console.log(`🎁 Awarding ${newBoxes} new blind box(es) based on backend data`);
          console.log(`📦 Adding: ${newBoxes}, New total: ${currentUnopened + newBoxes}`);
          
          // Add new boxes to existing unopened boxes
          const newUnopened = currentUnopened + newBoxes;
          setBlindBoxes(newUnopened);
          await saveToStorage('BLIND_BOXES', newUnopened);
          
          // Update total earned tracking
          const KEYS = getUserStorageKeys(user?.uid);
          await AsyncStorage.setItem(KEYS.TOTAL_BOXES_EARNED, totalBoxesEarned.toString());
        } else {
          console.log(`ℹ️ No new blind boxes earned (${totalBoxesEarned} <= ${previousTotalEarned})`);
        }
        
        return totalDistance;
      }
    } catch (error) {
      console.error('❌ Failed to sync total distance from backend:', error);
      // Don't throw error, just log it - we'll use local data
    }
  };

  // Sync pet collection from backend
  const syncPetCollectionFromBackend = async () => {
    if (!token) return;
    
    try {
      console.log('🔄 Syncing pet collection from backend...');
      
      const response = await api.getPetCollection(token);
      
      if (response) {
        console.log('📊 Backend pet collection data:', response);
        
        // Update local state with backend data
        if (response.user_pets) {
          // Check if user_pets contains Bulbasaur (old starter pet)
          let updatedUserPets = response.user_pets;
          if (updatedUserPets.includes('pokemon_001')) {
            console.log('🔄 Replacing Bulbasaur in user_pets with Pikachu...');
            updatedUserPets = updatedUserPets.filter(id => id !== 'pokemon_001');
            if (!updatedUserPets.includes('pokemon_004')) {
              updatedUserPets.push('pokemon_004'); // Add Pikachu
            }
          }
          setUserPets(updatedUserPets);
          await saveToStorage('USER_PETS', updatedUserPets);
        }
        
        if (response.blind_boxes !== undefined) {
          console.log(`📦 Backend blind boxes: ${response.blind_boxes}, Local blind boxes: ${blindBoxes}`);
          // Only update if backend has more blind boxes or if local is 0
          if (response.blind_boxes > blindBoxes || blindBoxes === 0) {
            console.log(`📦 Updating blind boxes from ${blindBoxes} to ${response.blind_boxes}`);
            setBlindBoxes(response.blind_boxes);
            await saveToStorage('BLIND_BOXES', response.blind_boxes);
          } else {
            console.log(`📦 Keeping local blind boxes: ${blindBoxes} (backend: ${response.blind_boxes})`);
          }
        }
        
        if (response.active_companion) {
          // Check if active companion is Bulbasaur (old starter pet)
          if (response.active_companion.id === 'pokemon_001' || response.active_companion.name === 'Bulbasaur') {
            console.log('🔄 Replacing old Bulbasaur starter with Pikachu...');
            const pikachu = PET_COLLECTION.find(pet => pet.name === 'Pikachu');
            if (pikachu) {
              const pikachuData = { ...pikachu, isStarterPet: true };
              setActiveCompanion(pikachuData);
              await saveToStorage('ACTIVE_COMPANION', pikachuData);
            }
          } else {
            setActiveCompanion(response.active_companion);
            await saveToStorage('ACTIVE_COMPANION', response.active_companion);
          }
        }
        
        if (response.achievement_history) {
          setAchievementHistory(response.achievement_history);
          await saveToStorage('ACHIEVEMENT_HISTORY', response.achievement_history);
        }
        
        // If user has no pets and no active companion, give them Pikachu as starter
        if ((!response.user_pets || response.user_pets.length === 0) && !response.active_companion) {
          console.log('🎉 User has no pets, giving Pikachu as starter...');
          await giveStarterPet();
        }
        
        console.log('✅ Pet collection synced from backend successfully');
      } else {
        // If no response from backend, give starter pet
        console.log('🎉 No backend data, giving Pikachu as starter...');
        await giveStarterPet();
      }
    } catch (error) {
      console.error('❌ Failed to sync pet collection from backend:', error);
      // If sync fails, give starter pet
      console.log('🎉 Backend sync failed, giving Pikachu as starter...');
      await giveStarterPet();
    }
  };

  // Sync pet collection to backend
  const syncPetCollectionToBackend = async () => {
    if (!token) return;
    
    try {
      console.log('🔄 Syncing pet collection to backend...');
      
      const collectionData = {
        user_pets: userPets,
        blind_boxes: blindBoxes,
        active_companion: activeCompanion,
        total_run_distance: totalRunDistance,
        achievement_history: achievementHistory
      };
      
      await api.syncPetCollection(collectionData, token);
      console.log('✅ Pet collection synced to backend successfully');
    } catch (error) {
      console.error('❌ Failed to sync pet collection to backend:', error);
      // Don't throw error, just log it
    }
  };

  // Recalculate blind boxes based on current total distance and user's goal
  const recalculateBlindBoxes = async () => {
    if (!token || !user) return;
    
    try {
      console.log('🔄 Recalculating blind boxes based on current goal...');
      
      // Get current total distance
      const response = await api.getWorkouts(token);
      if (response && response.workouts) {
        const totalDistance = response.workouts.reduce((sum, workout) => {
          return sum + (workout.distance_meters || 0);
        }, 0);
        
        console.log(`🎯 Recalculating with:`);
        console.log(`  - Total distance: ${totalDistance}m`);
        console.log(`  - User's goal: ${user.petRewardGoal}km (${metersPerBlindBox}m)`);
        
        // Calculate how many boxes user should have earned
        const totalBoxesEarned = Math.floor(totalDistance / metersPerBlindBox);
        
        // Get current unopened boxes
        const KEYS = getUserStorageKeys(user?.uid);
        const storedBoxes = await AsyncStorage.getItem(KEYS.BLIND_BOXES);
        const currentUnopened = storedBoxes ? parseInt(storedBoxes) : 0;
        
        // Get previous total earned
        const storedTotalEarned = await AsyncStorage.getItem(KEYS.TOTAL_BOXES_EARNED);
        const previousTotalEarned = storedTotalEarned ? parseInt(storedTotalEarned) : 0;
        
        console.log(`📊 Recalculation results:`);
        console.log(`  - Previous total earned: ${previousTotalEarned}`);
        console.log(`  - New total earned: ${totalBoxesEarned}`);
        console.log(`  - Current unopened: ${currentUnopened}`);
        
        if (totalBoxesEarned > previousTotalEarned) {
          const newBoxes = totalBoxesEarned - previousTotalEarned;
          const newUnopened = currentUnopened + newBoxes;
          
          console.log(`🎁 Awarding ${newBoxes} new blind box(es)`);
          console.log(`📦 New total unopened: ${newUnopened}`);
          
          setBlindBoxes(newUnopened);
          await saveToStorage('BLIND_BOXES', newUnopened);
          const KEYS = getUserStorageKeys(user?.uid);
          await AsyncStorage.setItem(KEYS.TOTAL_BOXES_EARNED, totalBoxesEarned.toString());
          
          // Sync to backend
          await syncPetCollectionToBackend();
        } else {
          console.log(`ℹ️ No new blind boxes earned`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to recalculate blind boxes:', error);
    }
  };

  // Give starter pet (Pikachu as default starter)
  const giveStarterPet = async () => {
    // Find Pikachu in the collection
    const pikachu = PET_COLLECTION.find(pet => pet.name === 'Pikachu');
    if (!pikachu) {
      console.error('❌ Pikachu not found in PET_COLLECTION');
      return;
    }

    const newUserPets = [pikachu.id];
    const starterPetData = {
      ...pikachu,
      isStarterPet: true // Mark as starter pet
    };

    setUserPets(newUserPets);
    setActiveCompanion(starterPetData);

    await Promise.all([
      saveToStorage('USER_PETS', newUserPets),
      saveToStorage('ACTIVE_COMPANION', starterPetData)
    ]);

    console.log('🎉 Starter Pikachu given to new user');

    // Sync to backend if user is logged in
    if (token) {
      try {
        await syncPetCollectionToBackend();
        console.log('✅ Starter Pikachu synced to backend');
      } catch (error) {
        console.error('❌ Failed to sync starter Pikachu to backend:', error);
      }
    }
  };

  // Award blind box when user completes running goal
  const awardBlindBox = async (reason = 'Running Goal Completed') => {
    const newBoxCount = blindBoxes + 1;
    setBlindBoxes(newBoxCount);

    const achievement = {
      id: Date.now().toString(),
      type: 'blind_box_earned',
      reason,
      timestamp: new Date().toISOString(),
      reward: 'Blind Box'
    };

    const newAchievements = [...achievementHistory, achievement];
    setAchievementHistory(newAchievements);

    await Promise.all([
      saveToStorage('BLIND_BOXES', newBoxCount),
      saveToStorage('ACHIEVEMENT_HISTORY', newAchievements)
    ]);

    // Sync to backend if user is logged in
    if (token) {
      try {
        console.log('🔄 Syncing blind box award to backend...');
        
        const collectionData = {
          user_pets: userPets,
          blind_boxes: newBoxCount, // Use the updated blind box count
          active_companion: activeCompanion,
          total_run_distance: totalRunDistance,
          achievement_history: newAchievements // Use the updated achievements
        };
        
        await api.syncPetCollection(collectionData, token);
        console.log('✅ Blind box award synced to backend');
      } catch (error) {
        console.error('❌ Failed to sync blind box award to backend:', error);
      }
    }

    return achievement;
  };

  // Open blind box and get random pet
  const openBlindBox = async () => {
    if (blindBoxes <= 0) {
      throw new Error('No blind boxes available');
    }

    const newPet = getRandomPetDrop();
    const isNewPet = !userPets.includes(newPet.id);

    // Reduce blind box count
    const newBoxCount = blindBoxes - 1;
    setBlindBoxes(newBoxCount);

    // Add pet to collection if new
    let newUserPets = userPets;
    if (isNewPet) {
      newUserPets = [...userPets, newPet.id];
      setUserPets(newUserPets);
    }

    // Create achievement record
    const achievement = {
      id: Date.now().toString(),
      type: 'pet_unlocked',
      reason: 'Blind Box Opened',
      timestamp: new Date().toISOString(),
      reward: newPet.name,
      petId: newPet.id,
      rarity: newPet.rarity,
      isNew: isNewPet,
      isDuplicate: !isNewPet
    };

    const newAchievements = [...achievementHistory, achievement];
    setAchievementHistory(newAchievements);

    // Save to storage
    await Promise.all([
      saveToStorage('BLIND_BOXES', newBoxCount),
      saveToStorage('USER_PETS', newUserPets),
      saveToStorage('ACHIEVEMENT_HISTORY', newAchievements)
    ]);

    // Sync to backend if user is logged in
    if (token) {
      try {
        console.log('🔄 Syncing blind box result to backend...');
        
        const collectionData = {
          user_pets: newUserPets, // Use the updated userPets
          blind_boxes: newBoxCount, // Use the updated blind box count
          active_companion: activeCompanion,
          total_run_distance: totalRunDistance,
          achievement_history: newAchievements // Use the updated achievements
        };
        
        await api.syncPetCollection(collectionData, token);
        console.log('✅ Blind box result synced to backend');
      } catch (error) {
        console.error('❌ Failed to sync blind box result to backend:', error);
      }
    }

    return {
      pet: newPet,
      isNew: isNewPet,
      achievement
    };
  };

  // Set active companion
  const setActiveCompanionPet = async (pet) => {
    // Allow Pikachu as starter pet even if not in userPets
    const isPikachu = pet.name === 'Pikachu';
    const isOwned = userPets.includes(pet.id) || isPikachu;
    
    if (!isOwned) {
      throw new Error('Pet not owned by user');
    }

    setActiveCompanion(pet);
    await saveToStorage('ACTIVE_COMPANION', pet);

    // Sync to backend if user is logged in
    if (token) {
      try {
        await api.setActiveCompanion(pet.id, token);
        console.log('✅ Active companion synced to backend');
      } catch (error) {
        console.error('❌ Failed to sync active companion to backend:', error);
      }
    }
  };

  // Check and update running goals
  const updateRunningProgress = async (distanceMeters) => {
    const achievements = [];
    let newGoals = { ...runningGoals };

    // Check daily goal
    if (!newGoals.daily.completed && distanceMeters >= newGoals.daily.distance) {
      newGoals.daily.completed = true;
      const achievement = await awardBlindBox('Daily Running Goal Completed');
      achievements.push(achievement);
    }

    // Check weekly goal
    if (!newGoals.weekly.completed && distanceMeters >= newGoals.weekly.distance) {
      newGoals.weekly.completed = true;
      const achievement = await awardBlindBox('Weekly Running Goal Completed');
      achievements.push(achievement);
    }

    setRunningGoals(newGoals);
    await saveToStorage('RUNNING_GOALS', newGoals);

    return achievements;
  };

  // Reset daily/weekly goals (call this daily/weekly)
  const resetGoals = async (type = 'daily') => {
    let newGoals = { ...runningGoals };

    if (type === 'daily') {
      newGoals.daily.completed = false;
    } else if (type === 'weekly') {
      newGoals.weekly.completed = false;
    }

    setRunningGoals(newGoals);
    await saveToStorage('RUNNING_GOALS', newGoals);
  };


  // Get user's collection stats
  const getCollectionStats = () => {
    const totalPets = PET_COLLECTION.length;
    // Include Pikachu as owned if user has no pets (starter pet)
    const ownedPets = userPets.length === 0 ? 1 : userPets.length;
    const completionRate = totalPets > 0 ? (ownedPets / totalPets) * 100 : 0;

    const rarityStats = {};
    Object.keys(RARITY_CONFIG).forEach(rarity => {
      const totalOfRarity = PET_COLLECTION.filter(pet => pet.rarity === rarity).length;
      const ownedOfRarity = PET_COLLECTION.filter(pet =>
        pet.rarity === rarity && (userPets.includes(pet.id) || (userPets.length === 0 && pet.name === 'Pikachu'))
      ).length;

      rarityStats[rarity] = {
        total: totalOfRarity,
        owned: ownedOfRarity,
        completion: totalOfRarity > 0 ? (ownedOfRarity / totalOfRarity) * 100 : 0
      };
    });

    return {
      totalPets,
      ownedPets,
      completionRate: Math.round(completionRate),
      rarityStats
    };
  };

  // Get user's owned pets with full data
  const getOwnedPets = () => {
    const ownedPets = PET_COLLECTION.filter(pet => userPets.includes(pet.id));
    
    // If user has no pets, include Pikachu as starter pet
    if (ownedPets.length === 0) {
      const pikachu = PET_COLLECTION.find(pet => pet.name === 'Pikachu');
      if (pikachu) {
        return [{ ...pikachu, isStarterPet: true }];
      }
    }
    
    return ownedPets;
  };

  // Add running distance and award blind boxes automatically
  const addRunningDistance = async (distanceMeters) => {
    const newTotalDistance = totalRunDistance + distanceMeters;
    
    // Calculate how many new blind boxes should be awarded based on user's custom goal
    const oldBoxes = Math.floor(totalRunDistance / metersPerBlindBox);
    const newBoxes = Math.floor(newTotalDistance / metersPerBlindBox);
    const boxesEarned = newBoxes - oldBoxes;
    
    console.log(`🎁 Blind box calculation:`);
    console.log(`  - Old total distance: ${totalRunDistance}m`);
    console.log(`  - New total distance: ${newTotalDistance}m`);
    console.log(`  - Meters per blind box: ${metersPerBlindBox}m`);
    console.log(`  - Old boxes earned: ${oldBoxes}`);
    console.log(`  - New boxes earned: ${newBoxes}`);
    console.log(`  - Boxes to award: ${boxesEarned}`);
    
    // Update total distance
    setTotalRunDistance(newTotalDistance);
    await saveToStorage('TOTAL_RUN_DISTANCE', newTotalDistance);
    
    // Award ALL blind boxes at once (avoid race condition)
    const achievements = [];
    if (boxesEarned > 0) {
      // Update blind box count once
      const newBlindBoxCount = blindBoxes + boxesEarned;
      setBlindBoxes(newBlindBoxCount);
      
      // Create achievements for each box
      for (let i = 0; i < boxesEarned; i++) {
        const achievement = {
          id: `${Date.now()}_${i}`,
          type: 'blind_box_earned',
          reason: `Ran ${metersPerBlindBox}m (${metersPerBlindBox / 1000}km)`,
          timestamp: new Date().toISOString(),
          reward: 'Blind Box'
        };
        achievements.push(achievement);
      }
      
      const newAchievements = [...achievementHistory, ...achievements];
      setAchievementHistory(newAchievements);
      
      // Save to storage
      await Promise.all([
        saveToStorage('BLIND_BOXES', newBlindBoxCount),
        saveToStorage('ACHIEVEMENT_HISTORY', newAchievements)
      ]);
      
      // Sync to backend if user is logged in
      if (token) {
        try {
          console.log(`🔄 Syncing ${boxesEarned} blind box(es) to backend...`);
          
          const collectionData = {
            user_pets: userPets,
            blind_boxes: newBlindBoxCount,
            active_companion: activeCompanion,
            total_run_distance: newTotalDistance,
            achievement_history: newAchievements
          };
          
          await api.syncPetCollection(collectionData, token);
          console.log('✅ Blind boxes synced to backend');
        } catch (error) {
          console.error('❌ Failed to sync blind boxes to backend:', error);
        }
      }
      
      console.log(`✅ Awarded ${boxesEarned} blind box(es), new total: ${newBlindBoxCount}`);
    }
    
    return {
      totalDistance: newTotalDistance,
      boxesEarned,
      achievements,
      progressToNextBox: newTotalDistance % metersPerBlindBox,
      remainingDistance: metersPerBlindBox - (newTotalDistance % metersPerBlindBox)
    };
  };

  // Get blind box progress info
  const getBlindBoxProgress = () => {
    const progressToNextBox = totalRunDistance % metersPerBlindBox;
    const remainingDistance = metersPerBlindBox - progressToNextBox;
    const progressPercentage = (progressToNextBox / metersPerBlindBox) * 100;
    
    return {
      totalDistance: totalRunDistance,
      progressToNextBox,
      remainingDistance,
      progressPercentage: Math.round(progressPercentage),
      metersPerBox: metersPerBlindBox
    };
  };

  const value = {
    // State
    userPets,
    blindBoxes,
    activeCompanion,
    runningGoals,
    achievementHistory,
    totalRunDistance,
    metersPerBlindBox,
    isLoading,

    // Actions
    awardBlindBox,
    openBlindBox,
    setActiveCompanionPet,
    updateRunningProgress,
    resetGoals,
    addRunningDistance,
    syncTotalDistanceFromBackend,
    syncPetCollectionFromBackend,
    syncPetCollectionToBackend,
    recalculateBlindBoxes,

    // Helpers
    getCollectionStats,
    getOwnedPets,
    getBlindBoxProgress,

    // Data
    allPets: PET_COLLECTION,
    rarityConfig: RARITY_CONFIG
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};