// client/src/context/AuthContext.js - FIXED
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

  useEffect(() => {
    if (accessToken && user) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [accessToken, user]);

  // Register volunteer
  const register = async (userData) => {
    try {
      // Convert files to FormData if needed
      let dataToSend = { ...userData };
      
      // If there are files, use FormData
      if (userData.profilePhoto || userData.documents?.length > 0) {
        const formData = new FormData();
        
        // Add all non-file fields
        Object.keys(userData).forEach(key => {
          if (key !== 'profilePhoto' && key !== 'documents' && key !== 'fingerprints') {
            if (typeof userData[key] === 'object') {
              formData.append(key, JSON.stringify(userData[key]));
            } else {
              formData.append(key, userData[key]);
            }
          }
        });
        
        // Add profile photo
        if (userData.profilePhoto) {
          formData.append('profilePhoto', userData.profilePhoto);
        }
        
        // Add documents
        if (userData.documents && userData.documents.length > 0) {
          userData.documents.forEach(file => {
            formData.append('documents', file);
          });
        }
        
        // Add fingerprints as JSON
        if (userData.fingerprints) {
          formData.append('fingerprints', JSON.stringify(userData.fingerprints));
        }
        
        dataToSend = formData;
      }

      // ✅ FIXED: Use REGISTER instead of REGISTER_VOLUNTEER
      const response = await axiosInstance.post(
        ENDPOINTS.AUTH.REGISTER,  // ✅ Correct!
        dataToSend,
        {
          headers: dataToSend instanceof FormData ? {
            'Content-Type': 'multipart/form-data'
          } : {}
        }
      );
      
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

  // Login volunteer
  const login = async (email, fingerprintData) => {
    try {
      // ✅ FIXED: Use LOGIN
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

  // Logout
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

  const value = {
    user,
    setUser,
    isAuthenticated,
    isLoading,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};