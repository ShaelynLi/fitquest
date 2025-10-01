import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { api } from '../services';

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
  return durationMinutes / distanceKm; // minutes per km
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

  // Use refs to persist across re-renders
  const locationSubscriptionRef = useRef(null);
  const metricsIntervalRef = useRef(null);
  const pauseStartTimeRef = useRef(null);
  const stateRef = useRef(state);
  const pendingPointsRef = useRef([]); // GPS points waiting to be uploaded
  const uploadIntervalRef = useRef(null); // Interval for uploading points

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

  // Upload GPS points to backend
  const uploadPendingPoints = async () => {
    const currentState = stateRef.current;
    if (!currentState.sessionId || pendingPointsRef.current.length === 0) {
      return;
    }

    try {
      const pointsToUpload = [...pendingPointsRef.current];
      pendingPointsRef.current = []; // Clear pending points

      // Convert points to backend format
      const formattedPoints = pointsToUpload.map(point => ({
        lat: point.latitude,
        lng: point.longitude,
        t_ms: point.timestamp,
      }));

      await api.addWorkoutPoints(currentState.sessionId, formattedPoints);
      console.log(`📍 Uploaded ${formattedPoints.length} GPS points to backend`);
    } catch (error) {
      console.error('❌ Failed to upload GPS points:', error);
      // Re-add points to pending queue for retry
      pendingPointsRef.current.unshift(...pointsToUpload);
    }
  };

  // Start periodic GPS point upload
  const startPointUpload = () => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
    }
    
    // Upload points every 10 seconds
    uploadIntervalRef.current = setInterval(uploadPendingPoints, 10000);
  };

  // Stop periodic GPS point upload
  const stopPointUpload = () => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
    
    // Upload any remaining points
    uploadPendingPoints();
  };

  // Start GPS tracking
  const startLocationTracking = async () => {
    if (state.locationPermission !== 'granted') {
      await requestLocationPermissions();
      return;
    }

    try {
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced, // Better battery life, still accurate
          timeInterval: 5000, // Update every 5 seconds (better battery)
          distanceInterval: 5, // Update every 5 meters (good balance)
          mayShowUserSettingsDialog: true, // Ask user to enable high accuracy
        },
        (location) => {
          const { latitude, longitude, accuracy, altitude, heading, speed } = location.coords;
          const timestamp = location.timestamp || Date.now();
          const newPoint = { latitude, longitude, timestamp };

          // Filter out inaccurate GPS points
          if (accuracy && accuracy > 50) { // Skip points with >50m accuracy
            console.log('⚠️ Skipping inaccurate GPS point:', accuracy.toFixed(1) + 'm');
            return;
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
        
        // Try to create workout session in backend (optional)
        // Note: This requires user authentication, so it's disabled for now
        // TODO: Add authentication integration
        try {
          // For now, skip backend integration and run in offline mode
          // const startTime = Date.now();
          // const session = await api.startWorkout('run', startTime, userToken);
          // dispatch({ type: RUN_ACTIONS.SET_SESSION_ID, payload: session.id });
          // startPointUpload();
          // console.log('✅ Workout session started with backend:', session.id);
          
          console.log('ℹ️ Running in offline mode - GPS tracking active');
        } catch (backendError) {
          console.warn('⚠️ Backend unavailable, running in offline mode:', backendError.message);
        }
        
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
    },

    resumeRun: async () => {
      dispatch({
        type: RUN_ACTIONS.RESUME_RUN,
        payload: { pauseStartTime: pauseStartTimeRef.current },
      });
      await startLocationTracking();
      startPointUpload(); // Resume uploading when resumed
    },

    completeRun: async () => {
      try {
        dispatch({ type: RUN_ACTIONS.SET_LOADING, payload: true });
        
        // Stop local tracking first (always works)
        dispatch({ type: RUN_ACTIONS.COMPLETE_RUN });
        stopLocationTracking();
        stopMetricsTracking();
        
        // Try to finish workout session in backend (optional)
        const currentState = stateRef.current;
        if (currentState.sessionId) {
          try {
            stopPointUpload(); // Upload any remaining points
            const endTime = Date.now();
            const finalSession = await api.finishWorkout(currentState.sessionId, endTime);
            console.log('✅ Workout session completed and saved to backend:', finalSession);
          } catch (backendError) {
            console.warn('⚠️ Failed to save to backend, but local workout completed:', backendError.message);
          }
        } else {
          console.log('ℹ️ Workout completed in offline mode');
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