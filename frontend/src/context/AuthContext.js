import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import backendApi from '../services/backendApi';

const STORAGE_KEY = 'auth_token';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async (email, password) => {},
  register: async (email, password, displayName) => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setToken(saved);
          const me = await backendApi.me(saved);
          setUser(me);
        }
      } catch (e) {
        // ignore initial load errors
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const res = await backendApi.login(email, password);
    const idToken = res.id_token;
    setToken(idToken);
    await AsyncStorage.setItem(STORAGE_KEY, idToken);
    const me = await backendApi.me(idToken);
    setUser(me);
  };

  const register = async (email, password, displayName) => {
    const res = await backendApi.register(email, password, displayName);
    const idToken = res.id_token;
    setToken(idToken);
    await AsyncStorage.setItem(STORAGE_KEY, idToken);
    const me = await backendApi.me(idToken);
    setUser(me);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({ user, token, loading, login, register, logout }), [user, token, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}


