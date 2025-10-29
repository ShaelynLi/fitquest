import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, spacing, typography, globalStyles } from '../../theme';
import { useRun } from '../../context/RunContext';
import { useAuth } from '../../context/AuthContext';
import { useDailyStats } from '../../context/DailyStatsContext';
import { api } from '../../services';

/**
 * PreRunScreen Component - Run Setup and Start
 *
 * The default screen when entering the Run tab. Features:
 * - Large start button for beginning a run
 * - Optional goal setting (distance/time targets)
 * - Location permission handling
 * - Run statistics preview
 * - Quick start with default settings
 *
 * Uses Aura Health design system with prominent action buttons.
 */
export default function PreRunScreen() {
  const {
    locationPermission,
    isLoading,
    error,
    targetDistance,
    targetDuration,
    requestLocationPermissions,
    startRun,
    setTargetDistance,
    setTargetDuration,
  } = useRun();

  const { token, refreshUser } = useAuth();
  const { loadDailyStats } = useDailyStats();

  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Weekly stats
  const [weeklyStats, setWeeklyStats] = useState({
    runs: 0,
    distance: 0,
    duration: 0,
  });

  // Check permissions on component mount
  useEffect(() => {
    if (!locationPermission) {
      requestLocationPermissions();
    }
  }, [locationPermission]);

  // Get user's current location for map background
  useEffect(() => {
    const getCurrentLocation = async () => {
      if (locationPermission === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005, // Small zoom level for close view
            longitudeDelta: 0.005,
          });
        } catch (error) {
          console.log('Error getting current location:', error);
        }
      }
    };

    getCurrentLocation();
  }, [locationPermission]);

  // Load weekly stats on mount
  useEffect(() => {
    loadWeeklyStats();
  }, [token]);

  // Load weekly stats from backend
  const loadWeeklyStats = async () => {
    if (!token) return;
    
    try {
      // Get the start and end of the current week (Monday to Sunday)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Calculate offset to Monday
      
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      // Fetch all workouts
      const response = await api.getWorkouts(token);
      
      if (response && response.workouts) {
        // Filter workouts for this week
        const weekWorkouts = response.workouts.filter(workout => {
          const workoutDate = new Date(workout.start_time);
          return workoutDate >= monday && workoutDate <= sunday;
        });

        // Calculate weekly totals
        const totalDistance = weekWorkouts.reduce((sum, w) => sum + (w.distance_meters || 0), 0);
        const totalDuration = weekWorkouts.reduce((sum, w) => sum + (w.duration_seconds || 0), 0);

        setWeeklyStats({
          runs: weekWorkouts.length,
          distance: totalDistance / 1000, // Convert to km
          duration: totalDuration,
        });

        console.log('📊 Weekly stats loaded:', {
          runs: weekWorkouts.length,
          distance: (totalDistance / 1000).toFixed(1) + ' km',
          duration: formatWeeklyTime(totalDuration),
        });
      }
    } catch (error) {
      console.error('❌ Failed to load weekly stats:', error);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Refreshing run data...');
      
      await Promise.all([
        refreshUser ? refreshUser() : Promise.resolve(),
        loadDailyStats ? loadDailyStats() : Promise.resolve(),
        loadWeeklyStats(),
      ]);
      
      console.log('✅ Run data refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh run data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle start run with permission check
  const handleStartRun = async () => {
    if (locationPermission !== 'granted') {
      Alert.alert(
        'Location Required',
        'GPS tracking is required to record your run. Please enable location services.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: requestLocationPermissions },
        ]
      );
      return;
    }

    try {
      await startRun();
    } catch (error) {
      Alert.alert('Error', 'Failed to start run tracking. Please try again.');
    }
  };

  // Format time for weekly stats display
  const formatWeeklyTime = (seconds) => {
    if (!seconds || seconds === 0) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.blue[500]}
            colors={[colors.blue[500]]}
          />
        }
      >
        {/* Location Status */}
        <View style={globalStyles.card}>
          <View style={styles.statusRow}>
            <Ionicons
              name={locationPermission === 'granted' ? 'location' : 'location-outline'}
              size={24}
              color={locationPermission === 'granted' ? colors.aurora.green : colors.textSecondary}
            />
            <View style={styles.statusContent}>
              <Text style={globalStyles.bodyText}>GPS Status</Text>
              <Text style={globalStyles.secondaryText}>
                {locationPermission === 'granted' ? 'Ready to track' : 'Location access needed'}
              </Text>
            </View>
            {locationPermission !== 'granted' && (
              <TouchableOpacity
                style={styles.enableButton}
                onPress={requestLocationPermissions}
              >
                <Text style={styles.enableButtonText}>Enable</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionSubheader}>This Week</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={globalStyles.mediumNumber}>{weeklyStats.runs}</Text>
              <Text style={globalStyles.secondaryText}>runs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={globalStyles.mediumNumber}>{weeklyStats.distance.toFixed(1)}</Text>
              <Text style={globalStyles.secondaryText}>km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={globalStyles.mediumNumber}>{formatWeeklyTime(weeklyStats.duration)}</Text>
              <Text style={globalStyles.secondaryText}>time</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Start Run Button - Large and prominent */}
          <TouchableOpacity
            style={[
              globalStyles.buttonPrimary,
              styles.startButton,
              !locationPermission === 'granted' && styles.disabledButton,
            ]}
            onPress={handleStartRun}
            disabled={isLoading || locationPermission !== 'granted'}
          >
            <View style={styles.startButtonContent}>
              <Ionicons
                name="play"
                size={32}
                color={colors.white}
              />
              <Text style={styles.startButtonText}>
                {isLoading ? 'Starting...' : 'Start Run'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollView: {
    flex: 1,
    padding: spacing.md,
  },

  // Status Row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  enableButton: {
    backgroundColor: colors.textPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  enableButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },


  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },

  // Actions
  actionsContainer: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  // Start Button - Extra prominent
  startButton: {
    paddingVertical: spacing.lg,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: colors.gray[400],
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  startButtonText: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '15',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
    gap: spacing.sm,
    marginHorizontal: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.error,
    flex: 1,
  },

});