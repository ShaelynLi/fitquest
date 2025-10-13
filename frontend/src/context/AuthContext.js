import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services';

const STORAGE_KEY = 'auth_token';

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

  // Load stored token on app startup to keep user logged in
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(STORAGE_KEY);

        if (storedToken) {
          console.log('📱 Found stored token, restoring session...');

          // Validate token and get user data
          try {
            const userData = await api.me(storedToken);
            setToken(storedToken);
            setUser(userData);
            console.log('✅ Session restored successfully');
          } catch (error) {
            console.error('❌ Stored token invalid, clearing...', error);
            // Token expired or invalid, clear it
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        } else {
          console.log('📱 No stored token found');
        }
      } catch (error) {
        console.error('❌ Failed to load stored auth:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    const idToken = res.id_token;
    setToken(idToken);
    await AsyncStorage.setItem(STORAGE_KEY, idToken);
    const me = await api.me(idToken);
    setUser(me);
  };

  const register = async (email, password, displayName) => {
    const res = await api.register(email, password, displayName);
    const idToken = res.id_token;
    setToken(idToken);
    await AsyncStorage.setItem(STORAGE_KEY, idToken);
    const me = await api.me(idToken);
    setUser(me);
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
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const refreshUser = async () => {
    if (!token) {
      console.log('⚠️ No token available, cannot refresh user data');
      return;
    }
    
    try {
      console.log('🔄 Refreshing user data from backend...');
      const userData = await api.me(token);
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


