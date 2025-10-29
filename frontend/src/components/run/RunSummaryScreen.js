import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { colors, spacing, typography, globalStyles } from '../../theme';
import { useRun } from '../../context/RunContext';
import { useGamification } from '../../context/GamificationContext';

/**
 * RunSummaryScreen Component - Post-Run Results
 *
 * Displays comprehensive run statistics after completion:
 * - Final metrics (time, distance, pace, calories)
 * - Goal achievement status
 * - Performance insights
 * - Save/share options
 * - Return to pre-run state
 *
 * Uses Aura Health design with celebration elements for achievements.
 */
const { width: screenWidth } = Dimensions.get('window');

export default function RunSummaryScreen() {
  const {
    distance,
    duration,
    averagePace,
    calories,
    targetDistance,
    targetDuration,
    routePoints,
    startTime,
    endTime,
    resetRun,
  } = useRun();

  const { addRunningDistance } = useGamification();

  const [mapRegion, setMapRegion] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [rewardsEarned, setRewardsEarned] = useState([]);
  const [showRewards, setShowRewards] = useState(false);
  const [blindBoxesEarned, setBlindBoxesEarned] = useState(0);

  // Calculate map region based on route points
  useEffect(() => {
    if (routePoints && routePoints.length > 0) {
      const latitudes = routePoints.map(point => point.latitude);
      const longitudes = routePoints.map(point => point.longitude);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      const latDelta = (maxLat - minLat) * 1.5 || 0.01; // Add padding
      const lngDelta = (maxLng - minLng) * 1.5 || 0.01;
      
      setMapRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(latDelta, 0.005), // Minimum zoom level
        longitudeDelta: Math.max(lngDelta, 0.005),
      });
    }
  }, [routePoints]);

  // Check for rewards on component mount
  useEffect(() => {
    checkForRewards();
  }, []);

  const checkForRewards = async () => {
    try {
      const result = await addRunningDistance(distance);
      
      // Show celebration if blind boxes earned
      if (result.boxesEarned > 0) {
        setBlindBoxesEarned(result.boxesEarned);
        setRewardsEarned(result.achievements);
        setShowRewards(true);
        
        // Show alert for blind boxes earned
        setTimeout(() => {
          Alert.alert(
            '🎉 Blind Box Earned!',
            `You earned ${result.boxesEarned} blind ${result.boxesEarned === 1 ? 'box' : 'boxes'} for running ${distance}m! Open them from the home screen.`,
            [{ text: 'Awesome!', style: 'default' }]
          );
        }, 500);
      }
    } catch (error) {
      console.error('Failed to check for rewards:', error);
    }
  };

  // Format time as HH:MM:SS or MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format distance
  const formatDistance = (meters) => {
    return (meters / 1000).toFixed(2);
  };

  // Format pace
  const formatPace = (minutesPerKm) => {
    if (minutesPerKm === 0 || !isFinite(minutesPerKm) || minutesPerKm < 0) return '--:--';
    
    // Apply reasonable limits to prevent extreme values
    const clampedPace = Math.max(1, Math.min(99, minutesPerKm));
    
    const minutes = Math.floor(clampedPace);
    const seconds = Math.round((clampedPace - minutes) * 60);
    
    // Ensure consistent formatting with leading zeros
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Achievements removed per product request

  // Get performance insights
  const getInsights = () => {
    const insights = [];

    // Pace analysis
    if (averagePace > 0 && averagePace < 6) {
      insights.push({
        icon: 'flash',
        text: 'Great pace! You\'re running fast.',
        type: 'positive',
      });
    } else if (averagePace >= 6 && averagePace <= 8) {
      insights.push({
        icon: 'checkmark',
        text: 'Good steady pace maintained.',
        type: 'neutral',
      });
    }

    // Distance feedback
    if (distance >= 3000) {
      insights.push({
        icon: 'trending-up',
        text: 'Excellent distance covered!',
        type: 'positive',
      });
    }

    // Consistency (based on route points)
    if (routePoints.length > 50) {
      insights.push({
        icon: 'pulse',
        text: 'Consistent GPS tracking throughout.',
        type: 'neutral',
      });
    }

    return insights;
  };

  // Share/Save actions removed; run is saved automatically when completed

  const insights = getInsights();

  return (
    <View style={globalStyles.screenContainer}>
      <ScrollView style={globalStyles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={globalStyles.pageTitle}>Run Complete</Text>
        </View>

        {/* Achievements section removed */}

        {/* Main Stats - no outer card wrapper and no section title */}
        <View style={styles.statsGrid}>
          {/* Time */}
          <View style={styles.statCard}>
            <Ionicons name="time" size={32} color={colors.aurora.blue} />
            <Text style={styles.statValue}>{formatTime(duration)}</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>

          {/* Distance */}
          <View style={styles.statCard}>
            <Ionicons name="location" size={32} color={colors.aurora.green} />
            <Text style={styles.statValue}>{formatDistance(distance)}</Text>
            <Text style={styles.statLabel}>Distance (km)</Text>
          </View>

          {/* Pace */}
          <View style={styles.statCard}>
            <Ionicons name="speedometer" size={32} color={colors.aurora.violet} />
            <Text style={styles.statValue}>{formatPace(averagePace)}</Text>
            <Text style={styles.statLabel}>Avg Pace (/km)</Text>
          </View>

          {/* Calories */}
          <View style={styles.statCard}>
            <Ionicons name="flame" size={32} color={colors.aurora.orange} />
            <Text style={styles.statValue}>{calories}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
        </View>

        {/* Goal Progress */}
        {(targetDistance || targetDuration) && (
          <View style={globalStyles.card}>
            <Text style={globalStyles.sectionHeader}>Goal Progress</Text>

            {targetDistance && (
              <View style={styles.goalItem}>
                <View style={styles.goalHeader}>
                  <Text style={globalStyles.bodyText}>Distance Goal</Text>
                  <Ionicons
                    name={distance >= targetDistance ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={distance >= targetDistance ? colors.aurora.green : colors.aurora.pink}
                  />
                </View>
                <Text style={globalStyles.secondaryText}>
                  {formatDistance(distance)} / {formatDistance(targetDistance)} km
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min((distance / targetDistance) * 100, 100)}%`,
                        backgroundColor: colors.aurora.blue,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {targetDuration && (
              <View style={styles.goalItem}>
                <View style={styles.goalHeader}>
                  <Text style={globalStyles.bodyText}>Time Goal</Text>
                  <Ionicons
                    name={duration >= targetDuration ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={duration >= targetDuration ? colors.aurora.green : colors.aurora.pink}
                  />
                </View>
                <Text style={globalStyles.secondaryText}>
                  {formatTime(duration)} / {formatTime(targetDuration)}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min((duration / targetDuration) * 100, 100)}%`,
                        backgroundColor: colors.aurora.violet,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <>
            <Text style={globalStyles.sectionHeader}>Performance Insights</Text>
            <View style={styles.insightsContainer}>
              {insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <Ionicons
                    name={insight.icon}
                    size={20}
                    color={insight.type === 'positive' ? colors.aurora.green : colors.textSecondary}
                  />
                  <Text style={globalStyles.bodyText}>{insight.text}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Route Map */}
        {routePoints.length > 1 && (
          <>
            <View style={styles.mapContainer}>
              {mapRegion && !mapError ? (
                <MapView
                  style={styles.summaryMap}
                  region={mapRegion}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  mapType="standard"
                  onError={(error) => {
                    console.log('Summary Map Error:', error);
                    setMapError(true);
                  }}
                >
                  {/* Route Polyline */}
                  <Polyline
                    coordinates={routePoints.map(point => ({
                      latitude: point.latitude,
                      longitude: point.longitude,
                    }))}
                    strokeColor={colors.aurora.blue}
                    strokeWidth={4}
                    lineJoin="round"
                    lineCap="round"
                  />
                  
                  {/* Start Point Marker */}
                  {routePoints.length > 0 && (
                    <Marker
                      coordinate={{
                        latitude: routePoints[0].latitude,
                        longitude: routePoints[0].longitude,
                      }}
                      title="Start"
                      description="Run started here"
                    >
                      <View style={styles.startMarker}>
                        <Ionicons name="play" size={16} color="white" />
                      </View>
                    </Marker>
                  )}
                  
                  {/* End Point Marker */}
                  {routePoints.length > 1 && (
                    <Marker
                      coordinate={{
                        latitude: routePoints[routePoints.length - 1].latitude,
                        longitude: routePoints[routePoints.length - 1].longitude,
                      }}
                      title="Finish"
                      description="Run ended here"
                    >
                      <View style={styles.endMarker}>
                        <Ionicons name="checkmark" size={16} color="white" />
                      </View>
                    </Marker>
                  )}
                </MapView>
              ) : (
                <View style={styles.mapFallback}>
                  <Ionicons 
                    name="map" 
                    size={48} 
                    color={colors.textSecondary} 
                  />
                  <Text style={styles.mapFallbackTitle}>Route Map</Text>
                  <Text style={styles.mapFallbackSubtitle}>
                    {mapError ? 'Map unavailable' : 'Loading route...'}
                  </Text>
                  <View style={styles.routeStats}>
                    <Text style={styles.routeStatsText}>
                      📍 {routePoints.length} GPS points recorded
                    </Text>
                    <Text style={styles.routeStatsText}>
                      📏 {formatDistance(distance)} total distance
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        {/* Route Details section removed */}

        {/* Share/Save buttons removed */}
      </ScrollView>
      {/* Complete Button */}
      <View style={styles.completeFooter}>
        <TouchableOpacity style={globalStyles.buttonPrimary} onPress={resetRun}>
          <Text style={globalStyles.buttonTextPrimary}>Complete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },

  // Achievements styles removed

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  statValue: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Goals
  goalItem: {
    marginBottom: spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Insights
  insightsContainer: {
    gap: spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  // Map Container
  mapContainer: {
    marginTop: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.gray[50],
  },
  summaryMap: {
    width: '100%',
    height: 200,
  },
  
  // Map Markers
  startMarker: {
    backgroundColor: colors.aurora.green,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  endMarker: {
    backgroundColor: colors.aurora.pink,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  // Map Fallback
  mapFallback: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    gap: spacing.sm,
  },
  mapFallbackTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  mapFallbackSubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  routeStats: {
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  routeStatsText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  // Route details styles removed

  // Action buttons styles removed

  // Complete footer
  completeFooter: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
});