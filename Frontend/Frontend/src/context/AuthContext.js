// client/src/context/AuthContext.js - ENHANCED ERROR HANDLING

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

  // ✅ Register - COMPLETE FIXED VERSION WITH BETTER ERROR HANDLING
  const register = async (userData) => {
    try {
      const formData = new FormData();
      let totalDataSize = 0;
      
      console.log('📤 Building registration form data...');
      
      // Add all fields to formData
      Object.keys(userData).forEach(key => {
        const value = userData[key];
        
        // ✅ Skip empty strings, null, undefined
        if (value === '' || value === null || value === undefined) {
          console.log(`⏭️ Skipping ${key} (empty/null/undefined)`);
          return;
        }
        
        // ✅ Skip empty arrays
        if (Array.isArray(value) && value.length === 0) {
          console.log(`⏭️ Skipping ${key} (empty array)`);
          return;
        }
        
        // ✅ Skip empty objects
        if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof File) && Object.keys(value).length === 0) {
          console.log(`⏭️ Skipping ${key} (empty object)`);
          return;
        }
        
        if (key === 'fingerprints') {
          const jsonStr = JSON.stringify(value);
          totalDataSize += jsonStr.length;
          formData.append(key, jsonStr);
          console.log(`📊 ${key}: ${Object.keys(value).length} fingers, ${(jsonStr.length / 1024).toFixed(2)} KB`);
        } else if (key === 'languages' || key === 'idProofType') {
          const jsonStr = JSON.stringify(value);
          totalDataSize += jsonStr.length;
          formData.append(key, jsonStr);
          console.log(`📊 ${key}: ${(jsonStr.length / 1024).toFixed(2)} KB`);
        } else if (key === 'profilePhoto' && value instanceof File) {
          formData.append('profilePhoto', value);
          totalDataSize += value.size;
          console.log(`📸 profilePhoto: ${value.name} (${(value.size / 1024).toFixed(2)} KB)`);
        } else if (key === 'profileImage' && typeof value === 'string' && value.startsWith('data:image')) {
          // ✅ Handle base64 image as fallback
          formData.append('profileImage', value);
          totalDataSize += value.length;
          console.log(`📸 profileImage: base64 string (${(value.length / 1024).toFixed(2)} KB)`);
        } else if (key === 'documents' && Array.isArray(value)) {
          value.forEach(file => {
            formData.append('documents', file);
            totalDataSize += file.size;
            console.log(`📄 document: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
          });
        } else {
          // For all other fields, convert to string
          const strValue = String(value);
          totalDataSize += strValue.length;
          formData.append(key, strValue);
          console.log(`📝 ${key}: ${strValue.substring(0, 50)}${strValue.length > 50 ? '...' : ''}`);
        }
      });

      console.log(`📦 Total request size: ${(totalDataSize / 1024).toFixed(2)} KB`);
      console.log('📤 Sending registration request...');
      const startTime = Date.now();

      const response = await axiosInstance.post(
        '/auth/register/volunteer',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // ✅ Increased to 2 minutes
          maxContentLength: 50 * 1024 * 1024, // 50MB
          maxBodyLength: 50 * 1024 * 1024, // 50MB
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📤 Upload progress: ${percentCompleted}%`);
          },
        }
      );

      const elapsed = Date.now() - startTime;
      console.log(`✅ Registration completed in ${elapsed}ms`);

      const { user: userData_, tokens } = response.data.data;

      setUser(userData_);
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      setIsAuthenticated(true);

      return response.data;

    } catch (error) {
      console.error('❌ Registration error:', error);
      
      // ✅ Better error handling for timeouts
      if (error.code === 'ECONNABORTED') {
        console.error('⏰ Request timed out after 2 minutes');
        throw new Error('Registration request timed out after 2 minutes. Please try again.');
      }
      
      if (error.response) {
        let errorMessage = 'Registration failed. Please check your input.';
        
        // ✅ Handle 409 Conflict (duplicate phone/email)
        if (error.response.status === 409) {
          if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data?.errors) {
            const errorsData = error.response.data.errors;
            if (Array.isArray(errorsData)) {
              const errorMessages = errorsData.map(e => 
                `${e.field}: ${e.message}`
              ).join('; ');
              errorMessage = `Conflict: ${errorMessages}`;
            }
          } else {
            errorMessage = 'A record with this information already exists. Please check your phone number or email.';
          }
        }
        // ✅ Handle validation errors
        else if (error.response.status === 400) {
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
        }
        // ✅ Handle other server errors
        else if (error.response.data?.message) {
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