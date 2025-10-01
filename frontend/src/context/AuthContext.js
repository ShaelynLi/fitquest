import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services';

const STORAGE_KEY = 'auth_token';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  isOnboarded: false,
  login: async (email, password) => {},
  register: async (email, password, displayName) => {},
  completeOnboarding: async (userData) => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setToken(saved);
          const me = await api.me(saved);
          setUser(me);
          // Check if user has completed onboarding
          const isOnboarded = me?.isOnboarded || false;
          setIsOnboarded(isOnboarded);
        }
      } catch (e) {
        // ignore initial load errors
      } finally {
        setLoading(false);
      }
    })();
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
    // Complete onboarding with backend
    const res = await api.completeOnboarding(userData);
    
    if (res.success) {
      // Get authentication token by logging in
      const loginRes = await api.login(userData.email, userData.password);
      const idToken = loginRes.id_token;
      setToken(idToken);
      await AsyncStorage.setItem(STORAGE_KEY, idToken);
      
      const me = await api.me(idToken);
      setUser(me);
      setIsOnboarded(true);
    } else {
      throw new Error(res.message || 'Onboarding failed');
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setIsOnboarded(false);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({ user, token, loading, isOnboarded, login, register, completeOnboarding, logout }), [user, token, loading, isOnboarded]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}


