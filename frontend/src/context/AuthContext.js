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
  // We no longer gate UI on onboarding; successful auth shows main UI

  useEffect(() => {
    // No auto-login on startup - always start from WelcomeScreen
    setLoading(false);
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

  const value = useMemo(() => ({ user, token, loading, login, register, completeOnboarding, logout }), [user, token, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}


