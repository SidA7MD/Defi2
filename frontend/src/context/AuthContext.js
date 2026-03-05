import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services';
import socketService from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('ihsan_token');
    const savedUser = localStorage.getItem('ihsan_user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);

        // Connect socket and join rooms
        socketService.connect();
        socketService.joinRooms(parsedUser);
      } catch {
        localStorage.removeItem('ihsan_token');
        localStorage.removeItem('ihsan_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login({ email, password });
    const { user: userData, token: userToken } = data.data;

    localStorage.setItem('ihsan_token', userToken);
    localStorage.setItem('ihsan_user', JSON.stringify(userData));

    setToken(userToken);
    setUser(userData);

    // Connect socket
    socketService.connect();
    socketService.joinRooms(userData);

    return userData;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authService.register(formData);
    const { user: userData, token: userToken } = data.data;

    localStorage.setItem('ihsan_token', userToken);
    localStorage.setItem('ihsan_user', JSON.stringify(userData));

    setToken(userToken);
    setUser(userData);

    socketService.connect();
    socketService.joinRooms(userData);

    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ihsan_token');
    localStorage.removeItem('ihsan_user');
    setToken(null);
    setUser(null);
    socketService.disconnect();
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
