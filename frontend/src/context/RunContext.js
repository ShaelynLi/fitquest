import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

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

  // Start GPS tracking
  const startLocationTracking = async () => {
    if (state.locationPermission !== 'granted') {
      await requestLocationPermissions();
      return;
    }

    try {
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Update every second
          distanceInterval: 5, // Update every 5 meters
        },
        (location) => {
          const { latitude, longitude, timestamp } = location.coords;
          const newPoint = { latitude, longitude, timestamp };

          dispatch({
            type: RUN_ACTIONS.UPDATE_LOCATION,
            payload: location.coords,
          });

          dispatch({
            type: RUN_ACTIONS.ADD_ROUTE_POINT,
            payload: newPoint,
          });
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
      dispatch({ type: RUN_ACTIONS.START_RUN });
      await startLocationTracking();
      startMetricsTracking();
    },

    pauseRun: () => {
      pauseStartTimeRef.current = Date.now();
      dispatch({ type: RUN_ACTIONS.PAUSE_RUN });
      stopLocationTracking();
    },

    resumeRun: async () => {
      dispatch({
        type: RUN_ACTIONS.RESUME_RUN,
        payload: { pauseStartTime: pauseStartTimeRef.current },
      });
      await startLocationTracking();
    },

    completeRun: () => {
      dispatch({ type: RUN_ACTIONS.COMPLETE_RUN });
      stopLocationTracking();
      stopMetricsTracking();
    },

    resetRun: () => {
      stopLocationTracking();
      stopMetricsTracking();
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