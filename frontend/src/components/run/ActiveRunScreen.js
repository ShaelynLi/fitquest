import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import MapView, { Polyline } from 'react-native-maps';
import { colors, spacing, typography, globalStyles } from '../../theme';
import { useRun, RUN_STATES } from '../../context/RunContext';

/**
 * ActiveRunScreen Component - Live GPS Tracking
 *
 * Displays real-time run metrics during an active session:
 * - Current distance, time, and pace
 * - Large, easy-to-read metrics for glance viewing
 * - Pause/Resume controls
 * - Stop/Finish run functionality
 * - Goal progress indicators
 * - Screen stays awake during tracking
 *
 * Uses Aura Health design with prominent metrics display.
 */
const { width, height } = Dimensions.get('window');

export default function ActiveRunScreen() {
  const {
    status,
    distance,
    duration,
    currentPace,
    averagePace,
    calories,
    targetDistance,
    targetDuration,
    currentLocation,
    routePoints,
    pauseRun,
    resumeRun,
    completeRun,
  } = useRun();

  const [showMap, setShowMap] = useState(true);
  const [mapRegion, setMapRegion] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [initialMapRegion, setInitialMapRegion] = useState(null);
  const [userInteractedWithMap, setUserInteractedWithMap] = useState(false);
  const mapRef = useRef(null);

  // Keep screen awake during run
  useEffect(() => {
    if (status === RUN_STATES.RUNNING) {
      activateKeepAwakeAsync();
    } else {
      deactivateKeepAwake();
    }

    return () => deactivateKeepAwake();
  }, [status]);

  // Update map region when location changes
  useEffect(() => {
    if (currentLocation && !userInteractedWithMap) {
      const newRegion = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005, // Zoom level for running
        longitudeDelta: 0.005,
      };
      setMapRegion(newRegion);
      
      // Store initial region for reset functionality
      if (!initialMapRegion) {
        setInitialMapRegion(newRegion);
      }
    }
  }, [currentLocation, userInteractedWithMap, initialMapRegion]);

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format distance as km with decimal
  const formatDistance = (meters) => {
    return (meters / 1000).toFixed(2);
  };

  // Format pace as MM:SS per km
  const formatPace = (minutesPerKm) => {
    if (minutesPerKm === 0 || !isFinite(minutesPerKm)) return '--:--';
    const minutes = Math.floor(minutesPerKm);
    const seconds = Math.round((minutesPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate goal progress
  const getDistanceProgress = () => {
    if (!targetDistance) return null;
    return Math.min((distance / targetDistance) * 100, 100);
  };

  const getTimeProgress = () => {
    if (!targetDuration) return null;
    return Math.min((duration / targetDuration) * 100, 100);
  };

  // Handle pause/resume
  const handlePauseResume = () => {
    if (status === RUN_STATES.RUNNING) {
      pauseRun();
    } else if (status === RUN_STATES.PAUSED) {
      resumeRun();
    }
  };

  // Handle stop run with confirmation
  const handleStopRun = () => {
    Alert.alert(
      'Finish Run',
      'Are you sure you want to finish your run? Your progress will be saved.',
      [
        { text: 'Continue Running', style: 'cancel' },
        { text: 'Finish Run', style: 'destructive', onPress: completeRun },
      ]
    );
  };

  // Map control functions
  const handleMapRegionChange = (region) => {
    setUserInteractedWithMap(true);
    setMapRegion(region);
  };

  const resetMapView = () => {
    if (initialMapRegion && mapRef.current) {
      setUserInteractedWithMap(false);
      mapRef.current.animateToRegion(initialMapRegion, 1000);
      setMapRegion(initialMapRegion);
    }
  };

  const zoomIn = () => {
    if (mapRegion && mapRef.current) {
      const newRegion = {
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta * 0.5,
        longitudeDelta: mapRegion.longitudeDelta * 0.5,
      };
      setUserInteractedWithMap(true);
      mapRef.current.animateToRegion(newRegion, 500);
      setMapRegion(newRegion);
    }
  };

  const zoomOut = () => {
    if (mapRegion && mapRef.current) {
      const newRegion = {
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta * 2,
        longitudeDelta: mapRegion.longitudeDelta * 2,
      };
      setUserInteractedWithMap(true);
      mapRef.current.animateToRegion(newRegion, 500);
      setMapRegion(newRegion);
    }
  };

  // GPS status indicator
  const getGPSStatus = () => {
    if (!currentLocation) return 'Searching...';
    return 'Connected';
  };

  const getGPSColor = () => {
    return currentLocation ? colors.aurora.green : colors.aurora.orange;
  };

  return (
    <View style={globalStyles.screenContainer}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.container}>
        {/* Map View with Smart Fallback */}
        <View style={styles.mapContainer}>
          {mapRegion && !mapError ? (
            // Real Map View (Works in Development Build)
            <>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  region={mapRegion}
                  showsUserLocation={true}
                  followsUserLocation={!userInteractedWithMap}
                  showsMyLocationButton={false}
                  mapType="standard"
                  pitchEnabled={false}
                  rotateEnabled={false}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  onRegionChangeComplete={handleMapRegionChange}
                  onError={(error) => {
                    console.log('MapView Error:', error);
                    setMapError(true);
                  }}
                  onMapReady={() => {
                    console.log('✅ MapView is ready');
                  }}
                >
                {/* Route Polyline */}
                {routePoints.length > 1 && (
                  <Polyline
                    coordinates={routePoints.map(point => ({
                      latitude: point.latitude,
                      longitude: point.longitude,
                    }))}
                    strokeColor={colors.aurora.blue}
                    strokeWidth={5}
                    lineJoin="round"
                    lineCap="round"
                  />
                )}

              </MapView>

              {/* Map Overlay */}
              <View style={styles.mapOverlay}>
                <View style={styles.gpsStatus}>
                  <Ionicons
                    name="radio"
                    size={16}
                    color={getGPSColor()}
                  />
                  <Text style={[styles.gpsText, { color: getGPSColor() }]}>
                    GPS: {getGPSStatus()}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {status === RUN_STATES.RUNNING ? 'RUNNING' : 'PAUSED'}
                  </Text>
                </View>
              </View>

              {/* Map Control Buttons */}
              <View style={styles.mapControls}>
                <TouchableOpacity
                  style={styles.mapControlButton}
                  onPress={zoomIn}
                >
                  <Ionicons name="add" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.mapControlButton}
                  onPress={zoomOut}
                >
                  <Ionicons name="remove" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                
                {userInteractedWithMap && (
                  <TouchableOpacity
                    style={[styles.mapControlButton, styles.resetButton]}
                    onPress={resetMapView}
                  >
                    <Ionicons name="locate" size={20} color={colors.aurora.blue} />
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            // Fallback View (Expo Go or Map Error)
            <>
              <View style={styles.mapFallback}>
                <Ionicons 
                  name="location" 
                  size={48} 
                  color={colors.aurora.blue} 
                />
                <Text style={styles.mapFallbackTitle}>GPS Tracking Active</Text>
                <Text style={styles.mapFallbackSubtitle}>
                  {mapError ? 'Map unavailable - GPS tracking continues' : 'Building map view...'}
                </Text>
                {currentLocation && (
                  <Text style={styles.locationInfo}>
                    📍 Lat: {currentLocation.latitude.toFixed(6)}
                    {'\n'}Lng: {currentLocation.longitude.toFixed(6)}
                  </Text>
                )}
                <Text style={styles.routeInfo}>
                  🛣️ Route Points: {routePoints.length}
                </Text>
                <Text style={styles.routeInfo}>
                  📡 GPS Status: {getGPSStatus()}
                </Text>
                <Text style={styles.buildInfo}>
                  💡 For full map view, use Development Build
                </Text>
              </View>

              {/* GPS Status Overlay */}
              <View style={styles.mapOverlay}>
                <View style={styles.gpsStatus}>
                  <Ionicons
                    name="radio"
                    size={16}
                    color={getGPSColor()}
                  />
                  <Text style={[styles.gpsText, { color: getGPSColor() }]}>
                    GPS: {getGPSStatus()}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {status === RUN_STATES.RUNNING ? 'RUNNING' : 'PAUSED'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Main Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricsContent}>
          {/* Time - Most prominent */}
          <View style={styles.primaryMetric}>
            <Text style={styles.primaryMetricValue}>
              {formatTime(duration)}
            </Text>
            <Text style={styles.primaryMetricLabel}>Time</Text>
          </View>

          {/* Distance and Pace */}
          <View style={styles.secondaryMetrics}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {formatDistance(distance)}
              </Text>
              <Text style={styles.metricLabel}>km</Text>
              {targetDistance && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${getDistanceProgress()}%`,
                          backgroundColor: colors.aurora.blue,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {getDistanceProgress().toFixed(0)}% of goal
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {formatPace(currentPace)}
              </Text>
              <Text style={styles.metricLabel}>pace</Text>
              <Text style={styles.metricSubtext}>
                per km
              </Text>
            </View>
          </View>

          {/* Additional Metrics */}
          <View style={styles.additionalMetrics}>
            <View style={styles.smallMetric}>
              <Text style={styles.smallMetricValue}>
                {formatPace(averagePace)}
              </Text>
              <Text style={styles.smallMetricLabel}>avg pace</Text>
            </View>
            <View style={styles.smallMetric}>
              <Text style={styles.smallMetricValue}>
                {calories}
              </Text>
              <Text style={styles.smallMetricLabel}>calories</Text>
            </View>
          </View>

          {/* Control Buttons - Now inside metrics container for better spacing */}
          <View style={styles.controlsContainer}>
            {/* Pause/Resume Button */}
            <TouchableOpacity
              style={[
                globalStyles.buttonSecondary,
                styles.controlButton,
                status === RUN_STATES.RUNNING ? styles.pauseButton : styles.resumeButton,
              ]}
              onPress={handlePauseResume}
            >
              <Ionicons
                name={status === RUN_STATES.RUNNING ? 'pause' : 'play'}
                size={24}
                color={status === RUN_STATES.RUNNING ? colors.aurora.orange : colors.aurora.green}
              />
              <Text style={[
                globalStyles.buttonTextSecondary,
                styles.controlButtonText,
                { color: status === RUN_STATES.RUNNING ? colors.aurora.orange : colors.aurora.green },
              ]}>
                {status === RUN_STATES.RUNNING ? 'Pause' : 'Resume'}
              </Text>
            </TouchableOpacity>

            {/* Stop Button */}
            <TouchableOpacity
              style={[globalStyles.buttonPrimary, styles.controlButton, styles.stopButton]}
              onPress={handleStopRun}
            >
              <Ionicons name="stop" size={24} color={colors.white} />
              <Text style={[globalStyles.buttonTextPrimary, styles.controlButtonText]}>
                Finish
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Goal Progress (if set) */}
        {(targetDistance || targetDuration) && (
          <View style={globalStyles.card}>
            <Text style={globalStyles.sectionSubheader}>Goal Progress</Text>

            {targetDistance && (
              <View style={styles.goalProgress}>
                <View style={styles.goalRow}>
                  <Text style={globalStyles.bodyText}>Distance</Text>
                  <Text style={globalStyles.bodyText}>
                    {formatDistance(distance)} / {formatDistance(targetDistance)} km
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${getDistanceProgress()}%`,
                        backgroundColor: colors.aurora.blue,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {targetDuration && (
              <View style={styles.goalProgress}>
                <View style={styles.goalRow}>
                  <Text style={globalStyles.bodyText}>Time</Text>
                  <Text style={globalStyles.bodyText}>
                    {formatTime(duration)} / {formatTime(targetDuration)}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${getTimeProgress()}%`,
                        backgroundColor: colors.aurora.violet,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        )}

          </View>

        {/* Status Message for Paused State */}
        {status === RUN_STATES.PAUSED && (
          <View style={styles.pausedMessage}>
            <Ionicons name="pause-circle" size={24} color={colors.aurora.orange} />
            <Text style={styles.pausedText}>
              Run paused. Tap Resume to continue tracking.
            </Text>
          </View>
        )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl, // 确保底部有足够的空间
  },
  container: {
    flex: 1,
  },

  // Map
  mapContainer: {
    height: 250, // 固定高度，更适合滚动视图
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.aurora.blue + '10',
    padding: spacing.xl,
  },
  mapFallbackTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.aurora.blue,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  mapFallbackSubtitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  locationInfo: {
    fontSize: typography.sizes.sm,
    fontFamily: 'monospace',
    color: colors.aurora.green,
    marginTop: spacing.lg,
    textAlign: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
  },
  routeInfo: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.aurora.purple,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  buildInfo: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center',
    backgroundColor: colors.aurora.blue + '10',
    padding: spacing.sm,
    borderRadius: 6,
  },

  // Content container for metrics and controls
  metricsContainer: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },

  // Header (moved to map overlay)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  gpsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gpsText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
  },
  statusBadge: {
    backgroundColor: colors.aurora.green + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.aurora.green,
  },

  // Metrics (updated for new layout)
  metricsContainer: {
    padding: spacing.lg,
  },
  metricsContent: {
    justifyContent: 'space-around',
    gap: spacing.lg,
  },

  // Primary metric (Time)
  primaryMetric: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryMetricValue: {
    fontSize: 64,
    fontFamily: typography.body, // Sans-serif for data clarity
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  primaryMetricLabel: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Secondary metrics
  secondaryMetrics: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  metricValue: {
    fontSize: typography.sizes.xxxl,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  metricLabel: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricSubtext: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },

  // Progress bars in metric cards
  progressContainer: {
    width: '100%',
    marginTop: spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Additional metrics
  additionalMetrics: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  smallMetric: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  smallMetricValue: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  smallMetricLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },

  // Goal progress
  goalProgress: {
    marginBottom: spacing.md,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  // Controls
  controlsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  controlButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  pauseButton: {
    borderColor: colors.aurora.orange,
  },
  resumeButton: {
    borderColor: colors.aurora.green,
  },
  stopButton: {
    backgroundColor: colors.aurora.pink,
  },

  // Paused state
  pausedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.aurora.orange + '15',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  pausedText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.aurora.orange,
    flex: 1,
  },

  // Map Controls
  mapControls: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'column',
    gap: spacing.xs,
  },
  mapControlButton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  resetButton: {
    backgroundColor: colors.aurora.blue + '15',
    borderColor: colors.aurora.blue,
  },
});