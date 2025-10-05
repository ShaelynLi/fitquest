import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DailyStatsContext = createContext();

// Storage keys
const STORAGE_KEYS = {
  DAILY_STATS: 'daily_stats',
  TODAY_DATE: 'today_date',
};

// Default daily stats structure
const DEFAULT_DAILY_STATS = {
  date: null,
  totalDistance: 0, // meters
  totalDuration: 0, // seconds
  totalCalories: 0,
  workoutCount: 0,
  lastActivity: null, // timestamp of last workout
};

export const DailyStatsProvider = ({ children }) => {
  const [dailyStats, setDailyStats] = useState(DEFAULT_DAILY_STATS);
  const [isLoading, setIsLoading] = useState(true);

  // Get today's date string (YYYY-MM-DD)
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Load daily stats from storage
  const loadDailyStats = async () => {
    try {
      setIsLoading(true);
      const today = getTodayString();
      const storedDate = await AsyncStorage.getItem(STORAGE_KEYS.TODAY_DATE);
      const storedStats = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_STATS);

      // If it's a new day, reset stats
      if (storedDate !== today) {
        const newStats = {
          ...DEFAULT_DAILY_STATS,
          date: today,
        };
        setDailyStats(newStats);
        await saveDailyStats(newStats);
        return;
      }

      // Load existing stats for today
      if (storedStats) {
        const parsedStats = JSON.parse(storedStats);
        setDailyStats(parsedStats);
      } else {
        const newStats = {
          ...DEFAULT_DAILY_STATS,
          date: today,
        };
        setDailyStats(newStats);
        await saveDailyStats(newStats);
      }
    } catch (error) {
      console.error('❌ Failed to load daily stats:', error);
      const today = getTodayString();
      const newStats = {
        ...DEFAULT_DAILY_STATS,
        date: today,
      };
      setDailyStats(newStats);
    } finally {
      setIsLoading(false);
    }
  };

  // Save daily stats to storage
  const saveDailyStats = async (stats) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(stats));
      await AsyncStorage.setItem(STORAGE_KEYS.TODAY_DATE, stats.date);
    } catch (error) {
      console.error('❌ Failed to save daily stats:', error);
    }
  };

  // Add workout data to daily stats
  const addWorkoutData = async (workoutData) => {
    try {
      const { distance, duration, calories } = workoutData;
      const now = Date.now();

      const updatedStats = {
        ...dailyStats,
        totalDistance: dailyStats.totalDistance + (distance || 0),
        totalDuration: dailyStats.totalDuration + (duration || 0),
        totalCalories: dailyStats.totalCalories + (calories || 0),
        workoutCount: dailyStats.workoutCount + 1,
        lastActivity: now,
      };

      setDailyStats(updatedStats);
      await saveDailyStats(updatedStats);

      console.log('✅ Daily stats updated:', {
        totalDistance: updatedStats.totalDistance,
        totalDuration: updatedStats.totalDuration,
        totalCalories: updatedStats.totalCalories,
        workoutCount: updatedStats.workoutCount,
      });

      return updatedStats;
    } catch (error) {
      console.error('❌ Failed to add workout data:', error);
      throw error;
    }
  };

  // Get formatted distance for display
  const getFormattedDistance = () => {
    const km = dailyStats.totalDistance / 1000;
    return {
      km: parseFloat(km.toFixed(2)),
      meters: dailyStats.totalDistance,
      display: `${km.toFixed(2)} km`,
    };
  };

  // Get formatted duration for display
  const getFormattedDuration = () => {
    const hours = Math.floor(dailyStats.totalDuration / 3600);
    const minutes = Math.floor((dailyStats.totalDuration % 3600) / 60);
    const seconds = dailyStats.totalDuration % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get last activity text
  const getLastActivityText = () => {
    if (!dailyStats.lastActivity) {
      return 'No activity today';
    }

    const now = Date.now();
    const diff = now - dailyStats.lastActivity;
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

  // Reset daily stats (for testing or new day)
  const resetDailyStats = async () => {
    const today = getTodayString();
    const newStats = {
      ...DEFAULT_DAILY_STATS,
      date: today,
    };
    setDailyStats(newStats);
    await saveDailyStats(newStats);
  };

  // Load stats on mount
  useEffect(() => {
    loadDailyStats();
  }, []);

  const value = {
    dailyStats,
    isLoading,
    addWorkoutData,
    getFormattedDistance,
    getFormattedDuration,
    getLastActivityText,
    resetDailyStats,
    loadDailyStats,
  };

  return (
    <DailyStatsContext.Provider value={value}>
      {children}
    </DailyStatsContext.Provider>
  );
};

export const useDailyStats = () => {
  const context = useContext(DailyStatsContext);
  if (!context) {
    throw new Error('useDailyStats must be used within a DailyStatsProvider');
  }
  return context;
};

export default DailyStatsContext;
