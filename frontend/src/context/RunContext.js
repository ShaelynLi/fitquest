import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';
import { api } from '../services';
import { useAuth } from './AuthContext';
import { useDailyStats } from './DailyStatsContext';

// Helper function to calculate workout metrics from frontend data
const calculateWorkoutMetrics = (state) => {
  const routePoints = state.routePoints || [];
  const startTime = state.startTime || Date.now();
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000; // seconds
  
  // Calculate total distance
  let totalDistance = 0;
  for (let i = 1; i < routePoints.length; i++) {
    const prev = routePoints[i - 1];
    const curr = routePoints[i];
    if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
      const distance = calculateDistanceBetweenPoints(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
      totalDistance += distance;
    }
  }
  
  // Calculate pace with reasonable limits
  let paceMinPerKm = 0;
  let paceMinPerMile = 0;
  let kmPerHour = 0;
  let mph = 0;
  
  if (totalDistance > 0 && duration > 0) {
    paceMinPerKm = (duration / 60) / (totalDistance / 1000);
    paceMinPerMile = paceMinPerKm * 1.60934;
    kmPerHour = (totalDistance / 1000) / (duration / 3600);
    mph = kmPerHour * 0.621371;
    
    // Apply reasonable limits for display
    // Maximum pace: 20 min/km (very slow walk)
    // Minimum pace: 2 min/km (very fast run)
    paceMinPerKm = Math.max(2, Math.min(20, paceMinPerKm));
    paceMinPerMile = Math.max(3.2, Math.min(32, paceMinPerMile));
    kmPerHour = Math.max(3, Math.min(30, kmPerHour));
    mph = Math.max(1.9, Math.min(18.6, mph));
  }
  
  // Format pace for display (MM:SS format) with fixed width
  const formatPace = (minutesPerKm) => {
    if (minutesPerKm <= 0 || !isFinite(minutesPerKm)) return "--:--";
    
    // Apply reasonable limits to prevent extreme values
    const clampedPace = Math.max(1, Math.min(99, minutesPerKm));
    
    const minutes = Math.floor(clampedPace);
    const seconds = Math.round((clampedPace - minutes) * 60);
    
    // Ensure consistent formatting with leading zeros
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate calories (simple estimation)
  const calories = totalDistance > 0 ? (totalDistance / 1000) * 70 * 1.0 : 0; // 70kg person, 1 cal/kg/km
  
  // Calculate elevation data
  const elevations = routePoints.map(p => p.altitude || 0).filter(e => e > 0);
  const elevationGain = elevations.length > 1 ? 
    elevations.slice(1).reduce((sum, curr, i) => {
      const diff = curr - elevations[i];
      return sum + (diff > 0 ? diff : 0);
    }, 0) : 0;
  
  const elevationLoss = elevations.length > 1 ? 
    elevations.slice(1).reduce((sum, curr, i) => {
      const diff = elevations[i] - curr;
      return sum + (diff > 0 ? diff : 0);
    }, 0) : 0;
  
  // Remove intensity analysis - not needed
  
  return {
    distance: {
      meters: Math.round(totalDistance),
      kilometers: Math.round(totalDistance / 1000 * 100) / 100,
      miles: Math.round(totalDistance / 1609.34 * 100) / 100
    },
    duration: {
      seconds: Math.round(duration),
      minutes: Math.round(duration / 60 * 100) / 100,
      formatted: formatDuration(duration)
    },
    pace: {
      min_per_km: Math.round(paceMinPerKm * 100) / 100,
      min_per_mile: Math.round(paceMinPerMile * 100) / 100,
      km_per_hour: Math.round(kmPerHour * 100) / 100,
      mph: Math.round(mph * 100) / 100,
      // Add formatted display values
      display_km: formatPace(paceMinPerKm),
      display_mile: formatPace(paceMinPerMile),
      display_speed_km: `${Math.round(kmPerHour)} km/h`,
      display_speed_mile: `${Math.round(mph)} mph`
    },
    calories: {
      burned: Math.round(calories),
      estimated: true,
      formula: 'distance_based',
      user_weight: 70
    },
    elevation_gain: Math.round(elevationGain),
    elevation_loss: Math.round(elevationLoss),
    elevation_profile: elevations
  };
};

// Helper function to calculate distance between two points (using existing function)
const calculateDistanceBetweenPoints = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Helper function to format duration
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * RunContext - GPS Run Tracking State Management
 *
 * Manages the complete run tracking lifecycle:
 * - Pre-run setup and permissions
 * - Active GPS tracking with real-time metrics
 * - Pause/resume functionality
 * - Run completion and data persistence
 *
 * Features:
 * - High-accuracy GPS tracking
 * - Real-time distance, pace, and time calculation
 * - Route point collection for mapping
 * - Session state persistence
 */

// Run states
export const RUN_STATES = {
  IDLE: 'idle',           // Not running, ready to start
  RUNNING: 'running',     // Actively tracking
  PAUSED: 'paused',       // Temporarily stopped
  COMPLETED: 'completed', // Finished run
};

// Initial state
const initialState = {
  // Run session state
  status: RUN_STATES.IDLE,
  sessionId: null, // Backend workout session ID
  startTime: null,
  endTime: null,
  pausedTime: 0, // Total time paused (for accurate duration)

  // GPS and location
  currentLocation: null,
  routePoints: [],
  locationPermission: null,
  isTrackingLocation: false,

  // Real-time metrics
  distance: 0,           // meters
  duration: 0,           // seconds (active running time)
  currentPace: 0,        // minutes per kilometer
  averagePace: 0,        // minutes per kilometer
  calories: 0,           // estimated calories burned

  // Run configuration
  targetDistance: null,  // Optional distance goal
  targetDuration: null,  // Optional time goal

  // Error handling
  error: null,
  isLoading: false,
};

// Action types
const RUN_ACTIONS = {
  // Permission and setup
  SET_LOCATION_PERMISSION: 'SET_LOCATION_PERMISSION',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',

  // Run session control
  START_RUN: 'START_RUN',
  SET_SESSION_ID: 'SET_SESSION_ID',
  PAUSE_RUN: 'PAUSE_RUN',
  RESUME_RUN: 'RESUME_RUN',
  COMPLETE_RUN: 'COMPLETE_RUN',
  RESET_RUN: 'RESET_RUN',

  // GPS tracking
  UPDATE_LOCATION: 'UPDATE_LOCATION',
  ADD_ROUTE_POINT: 'ADD_ROUTE_POINT',

  // Metrics updates
  UPDATE_METRICS: 'UPDATE_METRICS',

  // Configuration
  SET_TARGET_DISTANCE: 'SET_TARGET_DISTANCE',
  SET_TARGET_DURATION: 'SET_TARGET_DURATION',
};

// Reducer function
function runReducer(state, action) {
  switch (action.type) {
    case RUN_ACTIONS.SET_LOCATION_PERMISSION:
      return {
        ...state,
        locationPermission: action.payload,
        error: action.payload === 'granted' ? null : 'Location permission required',
      };

    case RUN_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case RUN_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case RUN_ACTIONS.START_RUN:
      return {
        ...state,
        status: RUN_STATES.RUNNING,
        startTime: Date.now(),
        endTime: null,
        pausedTime: 0,
        routePoints: [],
        distance: 0,
        duration: 0,
        calories: 0,
        isTrackingLocation: true,
        error: null,
      };

    case RUN_ACTIONS.SET_SESSION_ID:
      return {
        ...state,
        sessionId: action.payload,
      };

    case RUN_ACTIONS.PAUSE_RUN:
      return {
        ...state,
        status: RUN_STATES.PAUSED,
        isTrackingLocation: false,
      };

    case RUN_ACTIONS.RESUME_RUN:
      return {
        ...state,
        status: RUN_STATES.RUNNING,
        isTrackingLocation: true,
        pausedTime: state.pausedTime + (Date.now() - action.payload.pauseStartTime),
      };

    case RUN_ACTIONS.COMPLETE_RUN:
      return {
        ...state,
        status: RUN_STATES.COMPLETED,
        endTime: Date.now(),
        isTrackingLocation: false,
      };

    case RUN_ACTIONS.RESET_RUN:
      return {
        ...initialState,
        locationPermission: state.locationPermission, // Preserve permission status
      };

    case RUN_ACTIONS.UPDATE_LOCATION:
      return {
        ...state,
        currentLocation: action.payload,
      };

    case RUN_ACTIONS.ADD_ROUTE_POINT:
      return {
        ...state,
        routePoints: [...state.routePoints, action.payload],
      };

    case RUN_ACTIONS.UPDATE_METRICS:
      return {
        ...state,
        ...action.payload, // distance, duration, pace, calories
      };

    case RUN_ACTIONS.SET_TARGET_DISTANCE:
      return {
        ...state,
        targetDistance: action.payload,
      };

    case RUN_ACTIONS.SET_TARGET_DURATION:
      return {
        ...state,
        targetDuration: action.payload,
      };

    case 'NO_OP':
      return state;

    default:
      return state;
  }
}

// Utility functions for calculations
const calculateDistance = (routePoints) => {
  if (routePoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < routePoints.length; i++) {
    const prev = routePoints[i - 1];
    const curr = routePoints[i];

    // Haversine formula for distance between two GPS points
    const R = 6371e3; // Earth's radius in meters
    const φ1 = prev.latitude * Math.PI / 180;
    const φ2 = curr.latitude * Math.PI / 180;
    const Δφ = (curr.latitude - prev.latitude) * Math.PI / 180;
    const Δλ = (curr.longitude - prev.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    totalDistance += R * c;
  }

  return totalDistance;
};

const calculatePace = (distance, duration) => {
  if (distance === 0 || duration === 0) return 0;
  const distanceKm = distance / 1000;
  const durationMinutes = duration / 60;
  
  // Prevent division by zero and extreme values
  if (distanceKm < 0.001) return 0; // Less than 1 meter
  
  const pace = durationMinutes / distanceKm;
  
  // Apply reasonable limits (1-99 minutes per km)
  return Math.max(1, Math.min(99, pace));
};

// Format pace for display (e.g., 5.5 -> "05:30") with fixed width
const formatPace = (paceMinutes) => {
  if (paceMinutes === 0 || !isFinite(paceMinutes)) return "--:--";
  
  // Apply reasonable limits to prevent extreme values
  const clampedPace = Math.max(1, Math.min(99, paceMinutes));
  
  const minutes = Math.floor(clampedPace);
  const seconds = Math.round((clampedPace - minutes) * 60);
  
  // Ensure consistent formatting with leading zeros
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const calculateCalories = (distance, duration, weight = 70) => {
  // Simple estimation: ~0.75 calories per kg per km
  const distanceKm = distance / 1000;
  return Math.round(distanceKm * weight * 0.75);
};

// Context creation
const RunContext = createContext();

export const useRun = () => {
  const context = useContext(RunContext);
  if (!context) {
    throw new Error('useRun must be used within a RunProvider');
  }
  return context;
};

// Provider component
export const RunProvider = ({ children }) => {
  const [state, dispatch] = useReducer(runReducer, initialState);
  const { token } = useAuth();
  const { addWorkoutData } = useDailyStats();

  // Use refs to persist across re-renders
  const locationSubscriptionRef = useRef(null);
  const metricsIntervalRef = useRef(null);
  const pauseStartTimeRef = useRef(null);
  const stateRef = useRef(state);
  const pendingPointsRef = useRef([]); // GPS points waiting to be uploaded
  const uploadIntervalRef = useRef(null); // Interval for uploading points
  const accuracyUpgradedRef = useRef(false); // Track if accuracy has been upgraded

  // Initialize location permissions
  const requestLocationPermissions = async () => {
    dispatch({ type: RUN_ACTIONS.SET_LOADING, payload: true });

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      dispatch({
        type: RUN_ACTIONS.SET_LOCATION_PERMISSION,
        payload: status,
      });

      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to track your runs.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      dispatch({
        type: RUN_ACTIONS.SET_ERROR,
        payload: 'Failed to request location permissions',
      });
    } finally {
      dispatch({ type: RUN_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Upload GPS points to backend - DISABLED: We now use completeWorkout instead
  const uploadPendingPoints = async () => {
    // Disabled: We now collect all GPS points locally and upload them all at once via completeWorkout
    console.log('📍 GPS point upload disabled - using completeWorkout instead');
    return;
    
    // const currentState = stateRef.current;
    // if (!currentState.sessionId || pendingPointsRef.current.length === 0) {
    //   return;
    // }

    // const pointsToUpload = [...pendingPointsRef.current];
    // if (pointsToUpload.length === 0) return;
    
    // pendingPointsRef.current = []; // Clear pending points

    // try {
    //   // Convert points to backend format
    //   const formattedPoints = pointsToUpload.map(point => ({
    //     lat: point.latitude,
    //     lng: point.longitude,
    //     t_ms: point.timestamp, // Float timestamp for sub-millisecond precision
    //   }));

    //   await api.addWorkoutPoints(currentState.sessionId, formattedPoints, token);
    //   console.log(`📍 Uploaded ${formattedPoints.length} GPS points to backend`);
    // } catch (error) {
    //   console.error('❌ Failed to upload GPS points:', error);
    //   // Re-add points to pending queue for retry on next interval
    //   pendingPointsRef.current = [...pointsToUpload, ...pendingPointsRef.current];
    // }
  };

  // Start periodic GPS point upload
  const startPointUpload = () => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
    }
    
    // Upload points every 5 seconds for better real-time sync
    uploadIntervalRef.current = setInterval(uploadPendingPoints, 5000);
    console.log('📤 GPS point upload started');
  };

  // Stop periodic GPS point upload
  const stopPointUpload = () => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
    
    // Disabled: Upload any remaining points - we now use completeWorkout instead
    // uploadPendingPoints();
  };

  // Start GPS tracking
  const startLocationTracking = async () => {
    if (state.locationPermission !== 'granted') {
      await requestLocationPermissions();
      return;
    }

    try {
      // Quick GPS warmup with fallback
      console.log('🔥 GPS warming up...');
      
      try {
        // Try quick GPS first, then fallback to slower high accuracy
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Balanced speed/accuracy
          maximumAge: 15000, // Allow 15 second old position
          timeout: 2000, // Very quick 2 second timeout
        });
        
        console.log('✅ GPS warmup complete:', {
          latitude: initialLocation.coords.latitude.toFixed(8),
          longitude: initialLocation.coords.longitude.toFixed(8),
          accuracy: initialLocation.coords.accuracy?.toFixed(1) + 'm'
        });

        // Update location immediately
        dispatch({
          type: RUN_ACTIONS.UPDATE_LOCATION,
          payload: initialLocation.coords,
        });

        dispatch({
          type: RUN_ACTIONS.ADD_ROUTE_POINT,
          payload: {
            latitude: initialLocation.coords.latitude,
            longitude: initialLocation.coords.longitude,
            timestamp: initialLocation.timestamp || Date.now(),
          },
        });
      } catch (warmupError) {
        console.log('⚠️ GPS warmup failed, starting tracking anyway:', warmupError.message);
        // Continue with tracking even if warmup fails
      }

      // Trigger metrics update immediately
      console.log('📊 Triggering initial metrics update');
      dispatch({
        type: RUN_ACTIONS.UPDATE_METRICS,
        payload: {
          distance: 0,
          duration: 0,
          currentPace: 0,
          averagePace: 0,
          calories: 0,
        },
      });
      // Start with balanced accuracy, then upgrade to high accuracy after warmup
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced, // Start with balanced for speed
          timeInterval: 2000, // Update every 2 seconds initially
          distanceInterval: 5, // Update every 5 meters initially
          mayShowUserSettingsDialog: true, // Ask user to enable high accuracy
        },
        (location) => {
          const { latitude, longitude, accuracy, altitude, heading, speed } = location.coords;
          const timestamp = location.timestamp || Date.now();
          const newPoint = { latitude, longitude, timestamp };

          // No accuracy filtering - accept all GPS points
          // This ensures maximum data collection, especially useful for indoor/outdoor transitions
          if (accuracy && accuracy > 0) {
            console.log('📍 GPS Accuracy:', accuracy.toFixed(1) + 'm');
          }

          // Debug GPS data
          console.log('📍 GPS Update:', {
            latitude: latitude.toFixed(8),
            longitude: longitude.toFixed(8),
            accuracy: accuracy?.toFixed(1),
            altitude: altitude?.toFixed(1),
            heading: heading?.toFixed(1),
            speed: speed?.toFixed(1),
            timestamp: new Date(timestamp).toLocaleTimeString(),
            timeSinceLastUpdate: timestamp - (pendingPointsRef.current[pendingPointsRef.current.length - 1]?.timestamp || timestamp)
          });

          dispatch({
            type: RUN_ACTIONS.UPDATE_LOCATION,
            payload: location.coords,
          });

          dispatch({
            type: RUN_ACTIONS.ADD_ROUTE_POINT,
            payload: newPoint,
          });

          // Add point to pending upload queue
          pendingPointsRef.current.push(newPoint);

          // Upgrade to high accuracy after 30 seconds or 10 points
          if (!accuracyUpgradedRef.current && 
              (pendingPointsRef.current.length >= 10 || 
               (Date.now() - stateRef.current.startTime) > 30000)) {
            
            console.log('🚀 Upgrading GPS to high accuracy...');
            accuracyUpgradedRef.current = true;
            
            // Restart with high accuracy (async function)
            const upgradeToHighAccuracy = async () => {
              if (locationSubscriptionRef.current) {
                locationSubscriptionRef.current.remove();
              }
              
              locationSubscriptionRef.current = await Location.watchPositionAsync(
                {
                  accuracy: Location.Accuracy.BestForNavigation, // High accuracy
                  timeInterval: 1000, // Update every 1 second
                  distanceInterval: 1, // Update every 1 meter
                  mayShowUserSettingsDialog: false, // Don't ask again
                },
                (location) => {
                  const { latitude, longitude, accuracy, altitude, heading, speed } = location.coords;
                  const timestamp = location.timestamp || Date.now();
                  const newPoint = { latitude, longitude, timestamp };

                  // No accuracy filtering - accept all GPS points
                  if (accuracy && accuracy > 0) {
                    console.log('📍 GPS Accuracy:', accuracy.toFixed(1) + 'm');
                  }

                  dispatch({
                    type: RUN_ACTIONS.UPDATE_LOCATION,
                    payload: location.coords,
                  });

                  dispatch({
                    type: RUN_ACTIONS.ADD_ROUTE_POINT,
                    payload: newPoint,
                  });

                  pendingPointsRef.current.push(newPoint);
                }
              );
            };
            
            upgradeToHighAccuracy().catch(error => {
              console.log('⚠️ Failed to upgrade GPS accuracy:', error.message);
            });
          }
        }
      );
    } catch (error) {
      dispatch({
        type: RUN_ACTIONS.SET_ERROR,
        payload: 'Failed to start location tracking',
      });
    }
  };

  // Stop GPS tracking
  const stopLocationTracking = () => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }
  };

  // Update metrics periodically
  const startMetricsTracking = () => {
    // Prevent duplicate intervals
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }
    metricsIntervalRef.current = setInterval(() => {
      const currentState = stateRef.current;
      if (currentState.status === RUN_STATES.RUNNING) {
        const now = Date.now();
        const activeTime = (now - currentState.startTime - currentState.pausedTime) / 1000; // seconds
        const distance = calculateDistance(currentState.routePoints);
        const currentPace = calculatePace(distance, activeTime);
        const calories = calculateCalories(distance, activeTime);

        // Debug logging
        console.log('📊 Metrics Update:', {
          routePointsCount: currentState.routePoints.length,
          distance: Math.round(distance),
          activeTime: Math.round(activeTime),
          currentPace: Math.round(currentPace * 100) / 100,
          firstPoint: currentState.routePoints[0],
          lastPoint: currentState.routePoints[currentState.routePoints.length - 1]
        });

        dispatch({
          type: RUN_ACTIONS.UPDATE_METRICS,
          payload: {
            duration: Math.round(activeTime),
            distance: Math.round(distance),
            currentPace: Math.round(currentPace * 100) / 100,
            averagePace: Math.round(currentPace * 100) / 100,
            calories,
          },
        });
      }
    }, 1000);
  };

  const stopMetricsTracking = () => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }
  };

  // Action creators
  const actions = {
    // Setup and permissions
    requestLocationPermissions,

    // Run control
    startRun: async () => {
      try {
        dispatch({ type: RUN_ACTIONS.SET_LOADING, payload: true });
        
        // Start local tracking first (always works)
        dispatch({ type: RUN_ACTIONS.START_RUN });
        
        // Start GPS tracking and metrics (works offline)
        await startLocationTracking();
        startMetricsTracking();
        
        // Generate local session ID (no backend call during start)
        const sessionId = `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('🏃 Starting local workout session:', sessionId);
        dispatch({ type: RUN_ACTIONS.SET_SESSION_ID, payload: sessionId });
        // Disable real-time GPS upload - we'll upload everything at the end
        // startPointUpload();
        
      } catch (error) {
        console.error('❌ Failed to start workout session:', error);
        dispatch({ 
          type: RUN_ACTIONS.SET_ERROR, 
          payload: 'Failed to start GPS tracking. Please check location permissions.' 
        });
      } finally {
        dispatch({ type: RUN_ACTIONS.SET_LOADING, payload: false });
      }
    },

    pauseRun: () => {
      pauseStartTimeRef.current = Date.now();
      dispatch({ type: RUN_ACTIONS.PAUSE_RUN });
      stopLocationTracking();
      stopPointUpload(); // Stop uploading when paused
      // Stop metrics updates while paused
      stopMetricsTracking();
    },

    resumeRun: async () => {
      dispatch({
        type: RUN_ACTIONS.RESUME_RUN,
        payload: { pauseStartTime: pauseStartTimeRef.current },
      });
      await startLocationTracking();
      startPointUpload(); // Resume uploading when resumed
      // Resume metrics updates
      startMetricsTracking();
    },

    completeRun: async () => {
      try {
        dispatch({ type: RUN_ACTIONS.SET_LOADING, payload: true });
        
        // Stop local tracking first (always works)
        dispatch({ type: RUN_ACTIONS.COMPLETE_RUN });
        stopLocationTracking();
        stopMetricsTracking();
        
        // Complete workout with full data from frontend
        const currentState = stateRef.current;
        if (currentState.sessionId) {
          try {
            stopPointUpload(); // Upload any remaining points
            
            // Prepare complete workout data
            const endTime = Date.now();
            const startTime = currentState.startTime || endTime;
            
            // Get user's timezone info
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const timezoneOffset = new Date().getTimezoneOffset() / -60;
            
            // Calculate all metrics from frontend data
            const calculatedMetrics = calculateWorkoutMetrics(currentState);
            
            // Prepare complete workout data
            const completeWorkoutData = {
              session_id: currentState.sessionId,
              workout_type: 'run',
              
              // Time information
              start_time: {
                timestamp: startTime,
                timezone: timezone,
                timezoneOffset: timezoneOffset
              },
              end_time: {
                timestamp: endTime,
                timezone: timezone,
                timezoneOffset: timezoneOffset
              },
              
              // GPS trajectory data
              gps_points: currentState.routePoints || [],
              
              // Calculated metrics
              calculated_metrics: calculatedMetrics
            };
            
            console.log(`🏁 Completing workout with full data: ${currentState.sessionId}`);
            console.log(`📊 GPS points: ${completeWorkoutData.gps_points.length}, Distance: ${calculatedMetrics.distance?.meters || 0}m`);
            
            const result = await api.completeWorkout(completeWorkoutData, token);
            console.log('✅ Workout completed and saved to backend:', result);
            
            // Update daily stats with workout data
            try {
              const workoutData = {
                distance: calculatedMetrics.distance?.meters || 0,
                duration: calculatedMetrics.duration?.seconds || 0,
                calories: calculatedMetrics.calories?.burned || 0,
              };
              await addWorkoutData(workoutData);
              console.log('✅ Daily stats updated with workout data');
            } catch (statsError) {
              console.error('❌ Failed to update daily stats:', statsError);
            }
            
          } catch (backendError) {
            console.error('❌ Failed to complete workout:', backendError);
            console.error('❌ Error details:', {
              message: backendError.message,
              sessionId: currentState.sessionId,
              endTime: new Date().toISOString()
            });
            console.warn('⚠️ Failed to save to backend, but local workout completed:', backendError.message);
          }
        } else {
          console.log('ℹ️ Workout completed locally (no session ID)');
        }
      } catch (error) {
        console.error('❌ Failed to complete workout session:', error);
        // Local workout is still completed, just backend save failed
      } finally {
        dispatch({ type: RUN_ACTIONS.SET_LOADING, payload: false });
      }
    },

    resetRun: () => {
      stopLocationTracking();
      stopMetricsTracking();
      stopPointUpload();
      pendingPointsRef.current = []; // Clear pending points
      dispatch({ type: RUN_ACTIONS.RESET_RUN });
    },

    // Configuration
    setTargetDistance: (distance) => {
      dispatch({
        type: RUN_ACTIONS.SET_TARGET_DISTANCE,
        payload: distance,
      });
    },

    setTargetDuration: (duration) => {
      dispatch({
        type: RUN_ACTIONS.SET_TARGET_DURATION,
        payload: duration,
      });
    },
  };

  // Keep stateRef updated
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
      stopMetricsTracking();
      stopPointUpload();
    };
  }, []);

  const value = {
    ...state,
    ...actions,
  };

  return (
    <RunContext.Provider value={value}>
      {children}
    </RunContext.Provider>
  );
};