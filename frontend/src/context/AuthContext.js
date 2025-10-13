import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '../config/firebaseConfig';
import { api } from '../services';

const STORAGE_KEY = 'auth_token';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async (email, password) => {},
  register: async (email, password, displayName) => {},
  completeOnboarding: async (userData) => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const tokenRefreshInterval = useRef(null);

  // Set up token refresh callback for API service
  useEffect(() => {
    const getToken = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const freshToken = await currentUser.getIdToken(true);
        setToken(freshToken);
        await AsyncStorage.setItem(STORAGE_KEY, freshToken);
        return freshToken;
      }
      return null;
    };
    
    api.setTokenRefreshCallback(getToken);
    console.log('✅ Token refresh callback registered with API service');
  }, []);

  // Monitor Firebase Auth state and auto-refresh token
  useEffect(() => {
    console.log('🔥 Setting up Firebase Auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('🔥 Firebase user detected:', firebaseUser.email);
        
        try {
          // Get fresh ID token
          const idToken = await firebaseUser.getIdToken(false);
          console.log('🔑 Got fresh Firebase ID token');
          
          // Update token in state and storage
          setToken(idToken);
          await AsyncStorage.setItem(STORAGE_KEY, idToken);
          
          // Fetch user profile data
          try {
            const userData = await api.me(idToken);
            setUser(userData);
            console.log('✅ User profile loaded:', userData.email);
          } catch (error) {
            console.error('⚠️ Failed to load user profile:', error);
          }
          
          // Set up automatic token refresh every 50 minutes (tokens expire after 60 minutes)
          if (tokenRefreshInterval.current) {
            clearInterval(tokenRefreshInterval.current);
          }
          
          tokenRefreshInterval.current = setInterval(async () => {
            try {
              console.log('🔄 Auto-refreshing Firebase token...');
              const freshToken = await firebaseUser.getIdToken(true); // Force refresh
              setToken(freshToken);
              await AsyncStorage.setItem(STORAGE_KEY, freshToken);
              console.log('✅ Token auto-refreshed successfully');
            } catch (error) {
              console.error('❌ Token auto-refresh failed:', error);
            }
          }, 50 * 60 * 1000); // Refresh every 50 minutes
          
        } catch (error) {
          console.error('❌ Failed to get Firebase ID token:', error);
          setToken(null);
          setUser(null);
        }
      } else {
        console.log('🔥 No Firebase user, clearing session');
        setToken(null);
        setUser(null);
        await AsyncStorage.removeItem(STORAGE_KEY);
        
        if (tokenRefreshInterval.current) {
          clearInterval(tokenRefreshInterval.current);
          tokenRefreshInterval.current = null;
        }
      }
      
      setLoading(false);
    });

    // Cleanup
    return () => {
      console.log('🔥 Cleaning up Firebase Auth listener');
      unsubscribe();
      if (tokenRefreshInterval.current) {
        clearInterval(tokenRefreshInterval.current);
      }
    };
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Logging in with Firebase Auth...');
      // Sign in with Firebase (this will trigger onAuthStateChanged)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase login successful');
      
      // Get fresh ID token
      const idToken = await userCredential.user.getIdToken();
      
      // The onAuthStateChanged listener will handle setting token and user
      // But we'll set them immediately here for faster UI response
      setToken(idToken);
      await AsyncStorage.setItem(STORAGE_KEY, idToken);
      
      const userData = await api.me(idToken);
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error('❌ Firebase login failed:', error);
      throw error;
    }
  };

  const register = async (email, password, displayName) => {
    try {
      console.log('🔐 Registering with Firebase Auth...');
      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase registration successful');
      
      // Get fresh ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Set token immediately
      setToken(idToken);
      await AsyncStorage.setItem(STORAGE_KEY, idToken);
      
      const userData = await api.me(idToken);
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error('❌ Firebase registration failed:', error);
      throw error;
    }
  };

  const completeOnboarding = async (userData) => {
    // Complete onboarding/registration (sends verification email)
    const res = await api.completeOnboarding(userData);
    if (!res.success) {
      throw new Error(res.message || 'Onboarding failed');
    }
    // Return the result without logging in (user needs to verify email first)
    return res;
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      await signOut(auth);
      // onAuthStateChanged will handle clearing state
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Force clear even if Firebase signOut fails
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 Refreshing user data from backend...');
      
      // Get fresh token from Firebase
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('⚠️ No Firebase user, cannot refresh');
        return;
      }
      
      // Get fresh token (force refresh if needed)
      const freshToken = await currentUser.getIdToken(true);
      setToken(freshToken);
      await AsyncStorage.setItem(STORAGE_KEY, freshToken);
      
      // Fetch user data with fresh token
      const userData = await api.me(freshToken);
      setUser(userData);
      console.log('✅ User data refreshed successfully');
      return userData;
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);
      throw error;
    }
  };

  const value = useMemo(() => ({ user, token, loading, login, register, completeOnboarding, logout, refreshUser }), [user, token, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}


