import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services';
import { useAuth } from './AuthContext';

const DailyFoodContext = createContext();

// Storage keys
const STORAGE_KEYS = {
  DAILY_FOOD: 'daily_food',
  TODAY_DATE: 'today_date',
};

// Default daily food stats structure
const DEFAULT_DAILY_FOOD = {
  date: null,
  meals: {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  },
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
  totalFiber: 0,
  totalSugar: 0,
  lastMeal: null, // timestamp of last meal
};

export const DailyFoodProvider = ({ children }) => {
  const [dailyFood, setDailyFood] = useState(DEFAULT_DAILY_FOOD);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  // Get today's date string (YYYY-MM-DD)
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Load daily food data from backend
  const loadDailyFood = async (targetDate = null) => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const date = targetDate || getTodayString();
      
      console.log('🍎 Loading daily food for date:', date);
      
      const response = await api.getMeals(date, token);
      console.log('📊 Food logs response:', response);
      
      if (response && response.success) {
        const foodData = {
          date: response.date,
          meals: response.meals || {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
          },
          totalCalories: response.daily_totals?.calories || 0,
          totalProtein: response.daily_totals?.protein || 0,
          totalCarbs: response.daily_totals?.carbs || 0,
          totalFat: response.daily_totals?.fat || 0,
          totalFiber: response.daily_totals?.fiber || 0,
          totalSugar: response.daily_totals?.sugar || 0,
          lastMeal: response.total_logs > 0 ? Date.now() : null,
        };
        
        setDailyFood(foodData);
        console.log('✅ Daily food data loaded successfully');
      }
    } catch (error) {
      console.error('❌ Failed to load daily food:', error);
      // Reset to default on error
      const today = getTodayString();
      const defaultData = {
        ...DEFAULT_DAILY_FOOD,
        date: today,
      };
      setDailyFood(defaultData);
    } finally {
      setIsLoading(false);
    }
  };

  // Add food to daily stats
  const addFoodToDaily = async (foodData) => {
    try {
      const newFood = {
        id: foodData.id || Date.now().toString(),
        name: foodData.name,
        brand: foodData.brand || '',
        calories: foodData.calories || 0,
        protein: foodData.protein || 0,
        carbs: foodData.carbs || 0,
        fat: foodData.fat || 0,
        fiber: foodData.fiber || 0,
        sugar: foodData.sugar || 0,
        servingSize: foodData.servingSize || '1 serving',
        mealType: foodData.mealType || 'snacks',
        date: foodData.date || getTodayString(),
        loggedAt: new Date().toISOString(),
      };

      const updatedMeals = { ...dailyFood.meals };
      const mealType = newFood.mealType;
      
      if (!updatedMeals[mealType]) {
        updatedMeals[mealType] = [];
      }
      
      updatedMeals[mealType].push(newFood);

      const updatedDailyFood = {
        ...dailyFood,
        meals: updatedMeals,
        totalCalories: dailyFood.totalCalories + newFood.calories,
        totalProtein: dailyFood.totalProtein + newFood.protein,
        totalCarbs: dailyFood.totalCarbs + newFood.carbs,
        totalFat: dailyFood.totalFat + newFood.fat,
        totalFiber: dailyFood.totalFiber + newFood.fiber,
        totalSugar: dailyFood.totalSugar + newFood.sugar,
        lastMeal: Date.now(),
      };

      setDailyFood(updatedDailyFood);
      console.log('✅ Food added to daily stats:', newFood.name);
      
      return updatedDailyFood;
    } catch (error) {
      console.error('❌ Failed to add food to daily stats:', error);
      throw error;
    }
  };

  // Remove food from daily stats
  const removeFoodFromDaily = async (foodId, mealType) => {
    try {
      const updatedMeals = { ...dailyFood.meals };
      const mealList = updatedMeals[mealType] || [];
      const foodIndex = mealList.findIndex(food => food.id === foodId);
      
      if (foodIndex === -1) {
        console.warn('⚠️ Food not found in daily stats:', foodId);
        return;
      }

      const removedFood = mealList[foodIndex];
      mealList.splice(foodIndex, 1);
      updatedMeals[mealType] = mealList;

      const updatedDailyFood = {
        ...dailyFood,
        meals: updatedMeals,
        totalCalories: Math.max(0, dailyFood.totalCalories - removedFood.calories),
        totalProtein: Math.max(0, dailyFood.totalProtein - removedFood.protein),
        totalCarbs: Math.max(0, dailyFood.totalCarbs - removedFood.carbs),
        totalFat: Math.max(0, dailyFood.totalFat - removedFood.fat),
        totalFiber: Math.max(0, dailyFood.totalFiber - removedFood.fiber),
        totalSugar: Math.max(0, dailyFood.totalSugar - removedFood.sugar),
        lastMeal: mealList.length > 0 ? Date.now() : dailyFood.lastMeal,
      };

      setDailyFood(updatedDailyFood);
      console.log('✅ Food removed from daily stats:', removedFood.name);
      
      return updatedDailyFood;
    } catch (error) {
      console.error('❌ Failed to remove food from daily stats:', error);
      throw error;
    }
  };

  // Refresh daily food data from backend
  const refreshDailyFood = async (targetDate = null) => {
    try {
      console.log('🔄 Refreshing daily food data...');
      await loadDailyFood(targetDate);
      console.log('✅ Daily food data refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh daily food data:', error);
      throw error;
    }
  };

  // Get formatted nutrition data
  const getFormattedNutrition = () => {
    return {
      calories: Math.round(dailyFood.totalCalories),
      protein: Math.round(dailyFood.totalProtein * 10) / 10,
      carbs: Math.round(dailyFood.totalCarbs * 10) / 10,
      fat: Math.round(dailyFood.totalFat * 10) / 10,
      fiber: Math.round(dailyFood.totalFiber * 10) / 10,
      sugar: Math.round(dailyFood.totalSugar * 10) / 10,
    };
  };

  // Get daily nutrition goals (can be customized later)
  const getDailyGoals = () => {
    return {
      calories: 2000, // Default daily calorie goal
      protein: 150,   // grams
      carbs: 250,     // grams
      fat: 65,        // grams
      fiber: 25,      // grams
      sugar: 50,      // grams
    };
  };

  // Get calorie progress percentage
  const getCalorieProgress = () => {
    const goals = getDailyGoals();
    const progress = (dailyFood.totalCalories / goals.calories) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
  };

  // Get last meal text
  const getLastMealText = () => {
    if (!dailyFood.lastMeal) {
      return 'No meals today';
    }

    const now = Date.now();
    const diff = now - dailyFood.lastMeal;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  // Get meal count for today
  const getMealCount = () => {
    const allMeals = Object.values(dailyFood.meals).flat();
    return allMeals.length;
  };

  // Reset daily food data (for testing or new day)
  const resetDailyFood = async () => {
    const today = getTodayString();
    const newData = {
      ...DEFAULT_DAILY_FOOD,
      date: today,
    };
    setDailyFood(newData);
  };

  // Load food data on mount and when token changes
  useEffect(() => {
    if (token) {
      loadDailyFood();
    }
  }, [token]);

  const value = {
    dailyFood,
    isLoading,
    loadDailyFood,
    addFoodToDaily,
    removeFoodFromDaily,
    refreshDailyFood,
    getFormattedNutrition,
    getDailyGoals,
    getCalorieProgress,
    getLastMealText,
    getMealCount,
    resetDailyFood,
  };

  return (
    <DailyFoodContext.Provider value={value}>
      {children}
    </DailyFoodContext.Provider>
  );
};

export const useDailyFood = () => {
  const context = useContext(DailyFoodContext);
  if (!context) {
    throw new Error('useDailyFood must be used within a DailyFoodProvider');
  }
  return context;
};

export default DailyFoodContext;