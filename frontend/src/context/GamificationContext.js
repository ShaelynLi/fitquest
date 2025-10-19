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

const STORAGE_KEYS = {
  USER_PETS: '@gamification_user_pets',
  BLIND_BOXES: '@gamification_blind_boxes',
  ACTIVE_COMPANION: '@gamification_active_companion',
  RUNNING_GOALS: '@gamification_running_goals',
  ACHIEVEMENT_HISTORY: '@gamification_achievements',
  TOTAL_RUN_DISTANCE: '@gamification_total_run_distance'
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

  // Load data from storage on app start
  useEffect(() => {
    loadGamificationData();
  }, []);

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

  // Sync pet collection and total running distance from backend when user logs in
  useEffect(() => {
    if (token && user) {
      syncPetsFromBackend();
      syncTotalDistanceFromBackend();
    }
  }, [token, user]);

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

      const [
        storedPets,
        storedBoxes,
        storedCompanion,
        storedGoals,
        storedAchievements,
        storedDistance
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_PETS),
        AsyncStorage.getItem(STORAGE_KEYS.BLIND_BOXES),
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANION),
        AsyncStorage.getItem(STORAGE_KEYS.RUNNING_GOALS),
        AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENT_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.TOTAL_RUN_DISTANCE)
      ]);

      if (storedPets) setUserPets(JSON.parse(storedPets));
      if (storedBoxes) setBlindBoxes(parseInt(storedBoxes));
      if (storedCompanion) setActiveCompanion(JSON.parse(storedCompanion));
      if (storedGoals) setRunningGoals(JSON.parse(storedGoals));
      if (storedAchievements) setAchievementHistory(JSON.parse(storedAchievements));
      if (storedDistance) setTotalRunDistance(parseInt(storedDistance));

      // Give starter pet if no pets owned
      if (!storedPets || JSON.parse(storedPets).length === 0) {
        await giveStarterPet();
      }

    } catch (error) {
      console.error('Failed to load gamification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToStorage = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
    }
  };

  // Sync pet collection from backend
  const syncPetsFromBackend = async () => {
    if (!token) return;
    
    try {
      console.log('🐾 Syncing pet collection from backend...');
      
      // Get pets from backend
      const response = await api.getUserPets(token);
      
      if (response && response.success && response.pets) {
        const backendPets = response.pets;
        console.log(`📦 Backend pets: ${backendPets.length}`);
        
        // Get local pets
        const storedPets = await AsyncStorage.getItem(STORAGE_KEYS.USER_PETS);
        const localPets = storedPets ? JSON.parse(storedPets) : [];
        console.log(`📱 Local pets: ${localPets.length}`);
        
        // Merge local and backend pets (union of both)
        const mergedPets = Array.from(new Set([...localPets, ...backendPets]));
        console.log(`🔄 Merged pets: ${mergedPets.length}`);
        
        // If there are local pets not in backend, sync them
        const localOnlyPets = localPets.filter(id => !backendPets.includes(id));
        if (localOnlyPets.length > 0) {
          console.log(`⬆️ Syncing ${localOnlyPets.length} local-only pets to backend...`);
          try {
            await api.updateUserPets(mergedPets, token);
            console.log('✅ Local pets synced to backend');
          } catch (error) {
            console.error('❌ Failed to sync local pets to backend:', error);
          }
        }
        
        // Update state and storage with merged collection
        if (mergedPets.length !== localPets.length) {
          setUserPets(mergedPets);
          await saveToStorage(STORAGE_KEYS.USER_PETS, mergedPets);
          console.log('✅ Pet collection synced successfully');
        } else {
          console.log('✅ Pet collection already in sync');
        }
        
        return mergedPets;
      }
    } catch (error) {
      console.error('❌ Failed to sync pets from backend:', error);
      // Don't throw error - we'll use local data
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
        await saveToStorage(STORAGE_KEYS.TOTAL_RUN_DISTANCE, totalDistance);
        
        // Check if any new blind boxes should be awarded
        const totalBoxesEarned = Math.floor(totalDistance / metersPerBlindBox);
        const storedBoxes = await AsyncStorage.getItem(STORAGE_KEYS.BLIND_BOXES);
        const currentUnopened = storedBoxes ? parseInt(storedBoxes) : 0;
        
        // Calculate how many boxes user has earned in total vs local tracking
        // We need to track "total boxes earned" separately to avoid losing unopened boxes
        const storedTotalEarned = await AsyncStorage.getItem('@gamification_total_boxes_earned');
        const previousTotalEarned = storedTotalEarned ? parseInt(storedTotalEarned) : 0;
        
        // If backend shows user earned more boxes in total
        if (totalBoxesEarned > previousTotalEarned) {
          const newBoxes = totalBoxesEarned - previousTotalEarned;
          console.log(`🎁 Awarding ${newBoxes} new blind box(es) based on backend data`);
          console.log(`📊 Previous total earned: ${previousTotalEarned}, New total earned: ${totalBoxesEarned}`);
          console.log(`📦 Current unopened: ${currentUnopened}, Adding: ${newBoxes}, New total: ${currentUnopened + newBoxes}`);
          
          // Add new boxes to existing unopened boxes
          const newUnopened = currentUnopened + newBoxes;
          setBlindBoxes(newUnopened);
          await saveToStorage(STORAGE_KEYS.BLIND_BOXES, newUnopened);
          
          // Update total earned tracking
          await AsyncStorage.setItem('@gamification_total_boxes_earned', totalBoxesEarned.toString());
        }
        
        return totalDistance;
      }
    } catch (error) {
      console.error('❌ Failed to sync total distance from backend:', error);
      // Don't throw error, just log it - we'll use local data
    }
  };

  // Give starter pet (first pet from collection)
  const giveStarterPet = async () => {
    const starterPet = PET_COLLECTION[0]; // Pikachu as starter
    const newUserPets = [starterPet.id];

    setUserPets(newUserPets);
    setActiveCompanion(starterPet);

    await Promise.all([
      saveToStorage(STORAGE_KEYS.USER_PETS, newUserPets),
      saveToStorage(STORAGE_KEYS.ACTIVE_COMPANION, starterPet)
    ]);
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
      saveToStorage(STORAGE_KEYS.BLIND_BOXES, newBoxCount),
      saveToStorage(STORAGE_KEYS.ACHIEVEMENT_HISTORY, newAchievements)
    ]);

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

    // Save to local storage
    await Promise.all([
      saveToStorage(STORAGE_KEYS.BLIND_BOXES, newBoxCount),
      saveToStorage(STORAGE_KEYS.USER_PETS, newUserPets),
      saveToStorage(STORAGE_KEYS.ACHIEVEMENT_HISTORY, newAchievements)
    ]);

    // Sync to backend if user is logged in
    if (token && isNewPet) {
      try {
        console.log('🎁 Syncing new pet to backend:', newPet.id);
        await api.addPetToCollection(newPet.id, token);
        console.log('✅ Pet synced to backend successfully');
      } catch (error) {
        console.error('❌ Failed to sync pet to backend:', error);
        // Don't throw error - local save was successful
        // Backend sync will happen on next app start
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
    if (!userPets.includes(pet.id)) {
      throw new Error('Pet not owned by user');
    }

    setActiveCompanion(pet);
    await saveToStorage(STORAGE_KEYS.ACTIVE_COMPANION, pet);
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
    await saveToStorage(STORAGE_KEYS.RUNNING_GOALS, newGoals);

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
    await saveToStorage(STORAGE_KEYS.RUNNING_GOALS, newGoals);
  };

  // Get user's collection stats
  const getCollectionStats = () => {
    const totalPets = PET_COLLECTION.length;
    const ownedPets = userPets.length;
    const completionRate = totalPets > 0 ? (ownedPets / totalPets) * 100 : 0;

    const rarityStats = {};
    Object.keys(RARITY_CONFIG).forEach(rarity => {
      const totalOfRarity = PET_COLLECTION.filter(pet => pet.rarity === rarity).length;
      const ownedOfRarity = PET_COLLECTION.filter(pet =>
        pet.rarity === rarity && userPets.includes(pet.id)
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
    return PET_COLLECTION.filter(pet => userPets.includes(pet.id));
  };

  // Add running distance and award blind boxes automatically
  const addRunningDistance = async (distanceMeters) => {
    const newTotalDistance = totalRunDistance + distanceMeters;
    
    // Calculate how many new blind boxes should be awarded based on user's custom goal
    const oldBoxes = Math.floor(totalRunDistance / metersPerBlindBox);
    const newBoxes = Math.floor(newTotalDistance / metersPerBlindBox);
    const boxesEarned = newBoxes - oldBoxes;
    
    // Update total distance
    setTotalRunDistance(newTotalDistance);
    await saveToStorage(STORAGE_KEYS.TOTAL_RUN_DISTANCE, newTotalDistance);
    
    // Award blind boxes if earned any
    const achievements = [];
    if (boxesEarned > 0) {
      for (let i = 0; i < boxesEarned; i++) {
        const achievement = await awardBlindBox(`Ran ${metersPerBlindBox}m (${metersPerBlindBox / 1000}km)`);
        achievements.push(achievement);
      }
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
    syncPetsFromBackend,

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