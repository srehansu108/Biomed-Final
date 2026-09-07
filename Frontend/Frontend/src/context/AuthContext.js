// client/src/context/AuthContext.js

import React, { createContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useLocalStorage } from '../hooks/useLocalStorage';

// ✅ Export the context itself (named export)
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage('user', null);
  const [accessToken, setAccessToken] = useLocalStorage('accessToken', null);
  const [refreshToken, setRefreshToken] = useLocalStorage('refreshToken', null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [matchInfo, setMatchInfo] = useLocalStorage('matchInfo', null);

  useEffect(() => {
    if (accessToken && user) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [accessToken, user]);

  // ✅ Clear auth data
  const clearAuthData = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setMatchInfo(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('matchInfo');
  };

  // ✅ Logout
  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  // ✅ Refresh token
  const refreshTokenFunc = async () => {
    try {
      const currentRefreshToken = localStorage.getItem('refreshToken');
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axiosInstance.post('/auth/refresh-token', {
        refreshToken: currentRefreshToken,
      });

      const { tokens } = response.data.data;
      
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      
      return tokens;
    } catch (error) {
      console.error('Refresh token error:', error);
      await logout();
      throw error;
    }
  };

  // ✅ Register
  const register = async (userData) => {
    try {
      const formData = new FormData();
      
      // Add all fields to formData
      Object.keys(userData).forEach(key => {
        const value = userData[key];
        
        // ✅ Skip empty strings, null, undefined
        if (value === '' || value === null || value === undefined) {
          return;
        }
        
        if (key === 'fingerprints') {
          formData.append(key, JSON.stringify(value));
        } else if (key === 'languages' || key === 'idProofType') {
          formData.append(key, JSON.stringify(value));
        } else if (key === 'profilePhoto' && value instanceof File) {
          formData.append('profilePhoto', value);
        } else if (key === 'documents' && Array.isArray(value)) {
          value.forEach(file => {
            formData.append('documents', file);
          });
        } else {
          formData.append(key, String(value));
        }
      });

      const response = await axiosInstance.post(
        '/auth/register/volunteer',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        }
      );

      const { user: userData_, tokens } = response.data.data;

      setUser(userData_);
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      setIsAuthenticated(true);

      return response.data;

    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (error.response) {
        let errorMessage = 'Registration failed. Please check your input.';
        
        if (error.response.data?.errors) {
          const errorsData = error.response.data.errors;
          if (Array.isArray(errorsData)) {
            const errorMessages = errorsData.map(e => 
              `${e.field}: ${e.message}`
            ).join('; ');
            errorMessage = `Validation failed: ${errorMessages}`;
          } else if (errorsData.errors && Array.isArray(errorsData.errors)) {
            const errorMessages = errorsData.errors.map(e => 
              `${e.field}: ${e.message}`
            ).join('; ');
            errorMessage = `Validation failed: ${errorMessages}`;
          }
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('Server not responding. Please check your connection.');
      } else {
        throw new Error(error.message || 'Registration failed');
      }
    }
  };

  // ✅ Traditional login (email + fingerprint)
  const login = async (email, fingerprintData) => {
    try {
      const response = await axiosInstance.post('/auth/login', {
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
      let message = 'Login failed. Please try again.';
      if (error.response) {
        message = error.response.data?.message || message;
      }
      throw new Error(message);
    }
  };

  // ✅ Fingerprint-only login
  const loginWithFingerprint = async (responseData) => {
    try {
      const { user: userData_, tokens, match } = responseData;

      setUser(userData_);
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      setMatchInfo(match);
      setIsAuthenticated(true);

      return responseData;

    } catch (error) {
      console.error('❌ Fingerprint login error:', error);
      throw error;
    }
  };

  // ✅ Update user
  const updateUser = (updatedData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedData
    }));
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    isLoading,
    register,
    login,
    loginWithFingerprint,
    logout,
    refreshToken: refreshTokenFunc,
    updateUser,
    clearAuthData,
    matchInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ✅ Default export for backward compatibility
export default AuthContext;