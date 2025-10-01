import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PET_COLLECTION, getRandomPetDrop, RARITY_CONFIG } from '../data/pets';

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
  ACHIEVEMENT_HISTORY: '@gamification_achievements'
};

export const GamificationProvider = ({ children }) => {
  const [userPets, setUserPets] = useState([]); // Array of pet IDs user owns
  const [blindBoxes, setBlindBoxes] = useState(0); // Number of unopened blind boxes
  const [activeCompanion, setActiveCompanion] = useState(null); // Currently selected pet
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

  const loadGamificationData = async () => {
    try {
      setIsLoading(true);

      const [
        storedPets,
        storedBoxes,
        storedCompanion,
        storedGoals,
        storedAchievements
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_PETS),
        AsyncStorage.getItem(STORAGE_KEYS.BLIND_BOXES),
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANION),
        AsyncStorage.getItem(STORAGE_KEYS.RUNNING_GOALS),
        AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENT_HISTORY)
      ]);

      if (storedPets) setUserPets(JSON.parse(storedPets));
      if (storedBoxes) setBlindBoxes(parseInt(storedBoxes));
      if (storedCompanion) setActiveCompanion(JSON.parse(storedCompanion));
      if (storedGoals) setRunningGoals(JSON.parse(storedGoals));
      if (storedAchievements) setAchievementHistory(JSON.parse(storedAchievements));

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

    // Save to storage
    await Promise.all([
      saveToStorage(STORAGE_KEYS.BLIND_BOXES, newBoxCount),
      saveToStorage(STORAGE_KEYS.USER_PETS, newUserPets),
      saveToStorage(STORAGE_KEYS.ACHIEVEMENT_HISTORY, newAchievements)
    ]);

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

  const value = {
    // State
    userPets,
    blindBoxes,
    activeCompanion,
    runningGoals,
    achievementHistory,
    isLoading,

    // Actions
    awardBlindBox,
    openBlindBox,
    setActiveCompanionPet,
    updateRunningProgress,
    resetGoals,

    // Helpers
    getCollectionStats,
    getOwnedPets,

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