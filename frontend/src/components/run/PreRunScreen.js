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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, spacing, typography, globalStyles } from '../../theme';
import { useRun } from '../../context/RunContext';

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

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalType, setGoalType] = useState('distance'); // 'distance' or 'time'
  const [goalValue, setGoalValue] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);

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

  // Handle goal setting
  const handleSetGoal = () => {
    const value = parseFloat(goalValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Invalid Goal', 'Please enter a valid positive number.');
      return;
    }

    if (goalType === 'distance') {
      setTargetDistance(value * 1000); // Convert km to meters
    } else {
      setTargetDuration(value * 60); // Convert minutes to seconds
    }

    setShowGoalModal(false);
    setGoalValue('');
  };

  // Clear goals
  const handleClearGoals = () => {
    setTargetDistance(null);
    setTargetDuration(null);
  };

  // Format display values
  const formatDistance = (meters) => {
    if (!meters) return null;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <View style={styles.container}>
      {/* Location-Aware Background */}
      <View style={styles.mapBackground}>
        {/* Beautiful gradient suggesting outdoor/running environment */}
        <View style={styles.runningGradient} />

        {/* Location indicator if available */}
        {currentLocation && (
          <View style={styles.locationIndicator}>
            <Ionicons name="location" size={24} color={colors.white} />
            <Text style={styles.locationText}>
              Ready to track your route
            </Text>
          </View>
        )}
      </View>

      {/* Faded Overlay */}
      <View style={styles.mapOverlay} />

      {/* Content Container */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={globalStyles.pageTitle}>Ready to Run?</Text>
          <Text style={globalStyles.bodyText}>
            Track your route with GPS and monitor your progress in real-time
          </Text>
        </View>

        {/* Location Status */}
        <View style={[globalStyles.card, styles.transparentCard]}>
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

        {/* Current Goals */}
        {(targetDistance || targetDuration) && (
          <View style={[globalStyles.card, styles.transparentCard]}>
            <View style={styles.goalsHeader}>
              <Text style={globalStyles.sectionSubheader}>Today's Goals</Text>
              <TouchableOpacity onPress={handleClearGoals}>
                <Text style={styles.clearGoalsText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.goalsContainer}>
              {targetDistance && (
                <View style={styles.goalItem}>
                  <Ionicons name="location" size={20} color={colors.aurora.blue} />
                  <Text style={globalStyles.bodyText}>
                    Distance: {formatDistance(targetDistance)}
                  </Text>
                </View>
              )}
              {targetDuration && (
                <View style={styles.goalItem}>
                  <Ionicons name="time" size={20} color={colors.aurora.violet} />
                  <Text style={globalStyles.bodyText}>
                    Time: {formatDuration(targetDuration)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={[globalStyles.card, styles.transparentCard]}>
          <Text style={globalStyles.sectionSubheader}>This Week</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={globalStyles.mediumNumber}>0</Text>
              <Text style={globalStyles.secondaryText}>runs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={globalStyles.mediumNumber}>0.0</Text>
              <Text style={globalStyles.secondaryText}>km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={globalStyles.mediumNumber}>0:00</Text>
              <Text style={globalStyles.secondaryText}>time</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Set Goal Button */}
          <TouchableOpacity
            style={globalStyles.buttonSecondary}
            onPress={() => setShowGoalModal(true)}
          >
            <Ionicons name="flag" size={20} color={colors.textPrimary} />
            <Text style={[globalStyles.buttonTextSecondary, styles.buttonSpacing]}>
              Set Goal
            </Text>
          </TouchableOpacity>

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

      {/* Goal Setting Modal */}
      <Modal
        visible={showGoalModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={globalStyles.screenContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowGoalModal(false)}>
              <Text style={globalStyles.buttonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            <Text style={globalStyles.sectionSubheader}>Set Goal</Text>
            <TouchableOpacity onPress={handleSetGoal}>
              <Text style={globalStyles.buttonTextPrimary}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={globalStyles.contentContainer}>
            {/* Goal Type Selection */}
            <View style={styles.goalTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.goalTypeButton,
                  goalType === 'distance' && styles.goalTypeButtonActive,
                ]}
                onPress={() => setGoalType('distance')}
              >
                <Ionicons
                  name="location"
                  size={24}
                  color={goalType === 'distance' ? colors.white : colors.textPrimary}
                />
                <Text style={[
                  styles.goalTypeText,
                  goalType === 'distance' && styles.goalTypeTextActive,
                ]}>
                  Distance
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.goalTypeButton,
                  goalType === 'time' && styles.goalTypeButtonActive,
                ]}
                onPress={() => setGoalType('time')}
              >
                <Ionicons
                  name="time"
                  size={24}
                  color={goalType === 'time' ? colors.white : colors.textPrimary}
                />
                <Text style={[
                  styles.goalTypeText,
                  goalType === 'time' && styles.goalTypeTextActive,
                ]}>
                  Time
                </Text>
              </TouchableOpacity>
            </View>

            {/* Goal Value Input */}
            <View style={styles.inputContainer}>
              <Text style={globalStyles.bodyText}>
                Target {goalType === 'distance' ? 'Distance (km)' : 'Time (minutes)'}
              </Text>
              <TextInput
                style={styles.goalInput}
                value={goalValue}
                onChangeText={setGoalValue}
                placeholder={goalType === 'distance' ? '5.0' : '30'}
                keyboardType="numeric"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Quick Goal Presets */}
            <View style={styles.presetsContainer}>
              <Text style={globalStyles.secondaryText}>Quick Goals</Text>
              <View style={styles.presetButtons}>
                {goalType === 'distance' ? (
                  <>
                    <TouchableOpacity
                      style={styles.presetButton}
                      onPress={() => setGoalValue('1')}
                    >
                      <Text style={styles.presetButtonText}>1 km</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.presetButton}
                      onPress={() => setGoalValue('5')}
                    >
                      <Text style={styles.presetButtonText}>5 km</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.presetButton}
                      onPress={() => setGoalValue('10')}
                    >
                      <Text style={styles.presetButtonText}>10 km</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.presetButton}
                      onPress={() => setGoalValue('15')}
                    >
                      <Text style={styles.presetButtonText}>15 min</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.presetButton}
                      onPress={() => setGoalValue('30')}
                    >
                      <Text style={styles.presetButtonText}>30 min</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.presetButton}
                      onPress={() => setGoalValue('60')}
                    >
                      <Text style={styles.presetButtonText}>60 min</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container and Map
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  runningGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.aurora.blue,
    opacity: 0.8,
    // Create a subtle pattern suggesting a running track/path
  },
  locationIndicator: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xl,
    borderRadius: 12,
  },
  locationText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    opacity: 0.85, // Faded overlay to make content readable
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  transparentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent background
    backdropFilter: 'blur(10px)', // Blur effect (iOS only)
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent background
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
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
    backgroundColor: colors.aurora.blue,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  enableButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },

  // Goals
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  clearGoalsText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.aurora.pink,
  },
  goalsContainer: {
    gap: spacing.sm,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  buttonSpacing: {
    marginLeft: spacing.sm,
  },

  // Start Button - Extra prominent
  startButton: {
    paddingVertical: spacing.xl,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
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
    fontSize: typography.sizes.xl,
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
  },
  errorText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.error,
    flex: 1,
  },

  // Modal
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Goal Type Selection
  goalTypeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  goalTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  goalTypeButtonActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  goalTypeText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  goalTypeTextActive: {
    color: colors.white,
  },

  // Input
  inputContainer: {
    marginBottom: spacing.xl,
  },
  goalInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.sizes.lg,
    fontFamily: typography.body,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },

  // Presets
  presetsContainer: {
    marginBottom: spacing.xl,
  },
  presetButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  presetButton: {
    flex: 1,
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  presetButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
});