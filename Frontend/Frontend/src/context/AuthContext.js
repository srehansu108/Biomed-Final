import React, { createContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage('user', null);
  const [accessToken, setAccessToken] = useLocalStorage('accessToken', null);
  const [refreshToken, setRefreshToken] = useLocalStorage('refreshToken', null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    if (accessToken && user) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [accessToken, user]);

  // Register user
  const register = async (userData) => {
    try {
      const response = await axiosInstance.post(ENDPOINTS.AUTH.REGISTER, userData);
      const { user: userData_, tokens } = response.data.data;

      setUser(userData_);
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      setIsAuthenticated(true);

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      throw new Error(message);
    }
  };

  // Login user
  const login = async (email, fingerprintData) => {
    try {
      const response = await axiosInstance.post(ENDPOINTS.AUTH.LOGIN, {
        email,
        fingerprintData,
      });
      const { user: userData_, tokens } = response.data.data;

      setUser(userData_);
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      setIsAuthenticated(true);

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      throw new Error(message);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await axiosInstance.put(ENDPOINTS.USERS.UPDATE_PROFILE, userData);
      const updatedUser = response.data.data;
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      throw new Error(message);
    }
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    isLoading,
    register,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};  // <-- This closing curly brace was missing!