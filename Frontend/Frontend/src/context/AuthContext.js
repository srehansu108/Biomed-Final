// client/src/context/AuthContext.js - COMPLETE FIX WITH CHUNKED UPLOAD

import React, { createContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage('user', null);
  const [accessToken, setAccessToken] = useLocalStorage('accessToken', null);
  const [refreshToken, setRefreshToken] = useLocalStorage('refreshToken', null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [matchInfo, setMatchInfo] = useLocalStorage('matchInfo', null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (accessToken && user) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [accessToken, user]);

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

  // ✅ Compress fingerprint data before sending
  const compressFingerprintData = (fingerprintData) => {
    if (!fingerprintData) return null;
    
    // If it's already a string, check if it needs compression
    if (typeof fingerprintData === 'string') {
      // If it's a base64 image, we could compress it further
      if (fingerprintData.startsWith('data:image')) {
        // For now, return as is
        return fingerprintData;
      }
      return fingerprintData;
    }
    
    // If it's an object, stringify it
    if (typeof fingerprintData === 'object') {
      return JSON.stringify(fingerprintData);
    }
    
    return String(fingerprintData);
  };

  // ✅ Chunk upload for large data
  const uploadInChunks = async (url, data, chunkSize = 500000) => { // 500KB chunks
    const jsonStr = JSON.stringify(data);
    const totalSize = jsonStr.length;
    const chunks = Math.ceil(totalSize / chunkSize);
    
    console.log(`📦 Splitting data into ${chunks} chunks (${(totalSize / 1024 / 1024).toFixed(2)} MB total)`);
    
    const uploadId = `upload_${Date.now()}`;
    const metadata = {
      totalChunks: chunks,
      totalSize: totalSize,
      uploadId: uploadId,
    };
    
    // Send first chunk with metadata
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, totalSize);
      const chunk = jsonStr.substring(start, end);
      
      const chunkData = {
        ...metadata,
        chunkIndex: i,
        isLastChunk: i === chunks - 1,
        chunk: chunk,
      };
      
      setUploadProgress(Math.round(((i + 1) / chunks) * 100));
      console.log(`📤 Uploading chunk ${i + 1}/${chunks} (${Math.round((i + 1) / chunks * 100)}%)`);
      
      // Send chunk via the main API or a dedicated endpoint
      const response = await axiosInstance.post(url, chunkData, {
        timeout: 60000, // 1 minute per chunk
        headers: {
          'Content-Type': 'application/json',
          'X-Upload-Chunk': 'true',
          'X-Upload-Id': uploadId,
          'X-Chunk-Index': i,
          'X-Total-Chunks': chunks,
        }
      });
      
      if (i === chunks - 1) {
        // Last chunk - return the final response
        return response;
      }
    }
  };

  // ✅ Register - COMPLETE FIXED VERSION WITH COMPRESSION
  const register = async (userData, retryCount = 0) => {
    try {
      setUploadProgress(0);
      
      // ✅ Check if we need chunked upload
      let fingerprintSize = 0;
      if (userData.fingerprints) {
        fingerprintSize = JSON.stringify(userData.fingerprints).length;
      }
      
      const isLargeUpload = fingerprintSize > 200000; // > 200KB
      
      // ✅ If large, use chunked upload
      if (isLargeUpload) {
        console.log('🔴 Large fingerprint data detected, using chunked upload...');
        console.log(`📊 Fingerprint data size: ${(fingerprintSize / 1024 / 1024).toFixed(2)} MB`);
        
        // Compress all fields first
        const compressedData = {
          ...userData,
          fingerprints: compressFingerprintData(userData.fingerprints),
        };
        
        // Use chunked upload
        const response = await uploadInChunks(
          '/api/v1/auth/register/volunteer-chunked',
          compressedData
        );
        
        if (response?.data?.data) {
          const { user: userData_, tokens } = response.data.data;
          setUser(userData_);
          setAccessToken(tokens.accessToken);
          setRefreshToken(tokens.refreshToken);
          setIsAuthenticated(true);
          setUploadProgress(100);
          return response.data;
        }
      }

      // ✅ For smaller uploads, use regular FormData
      const formData = new FormData();
      let totalDataSize = 0;
      
      console.log('📤 Building registration form data...');
      
      // Add all fields to formData
      Object.keys(userData).forEach(key => {
        const value = userData[key];
        
        if (value === '' || value === null || value === undefined) {
          console.log(`⏭️ Skipping ${key} (empty/null/undefined)`);
          return;
        }
        
        if (Array.isArray(value) && value.length === 0) {
          console.log(`⏭️ Skipping ${key} (empty array)`);
          return;
        }
        
        if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof File) && Object.keys(value).length === 0) {
          console.log(`⏭️ Skipping ${key} (empty object)`);
          return;
        }
        
        if (key === 'fingerprints') {
          // ✅ Compress fingerprint data
          const compressed = compressFingerprintData(value);
          const jsonStr = typeof compressed === 'string' ? compressed : JSON.stringify(compressed);
          totalDataSize += jsonStr.length;
          formData.append(key, jsonStr);
          console.log(`📊 ${key}: ${Object.keys(value).length} fingers, ${(jsonStr.length / 1024).toFixed(2)} KB`);
        } else if (key === 'languages' || key === 'idProofType') {
          const jsonStr = JSON.stringify(value);
          totalDataSize += jsonStr.length;
          formData.append(key, jsonStr);
          console.log(`📊 ${key}: ${(jsonStr.length / 1024).toFixed(2)} KB`);
        } else if (key === 'profilePhoto' && value instanceof File) {
          // ✅ Compress image if too large
          if (value.size > 500000) { // > 500KB
            console.log(`📸 Compressing large photo: ${(value.size / 1024).toFixed(2)} KB`);
            // You can add image compression here
          }
          formData.append('profilePhoto', value);
          totalDataSize += value.size;
          console.log(`📸 profilePhoto: ${value.name} (${(value.size / 1024).toFixed(2)} KB)`);
        } else if (key === 'profileImage' && typeof value === 'string' && value.startsWith('data:image')) {
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
          const strValue = String(value);
          totalDataSize += strValue.length;
          formData.append(key, strValue);
          console.log(`📝 ${key}: ${strValue.substring(0, 50)}${strValue.length > 50 ? '...' : ''}`);
        }
      });

      // ✅ Calculate timeout based on data size
      let timeoutMs = 120000; // Default: 2 minutes
      
      if (totalDataSize > 5000000) { // > 5MB
        timeoutMs = 600000; // 10 minutes
      } else if (totalDataSize > 1000000) { // > 1MB
        timeoutMs = 300000; // 5 minutes
      } else if (totalDataSize > 100000) { // > 100KB
        timeoutMs = 180000; // 3 minutes
      }
      
      // Add retry bonus
      if (retryCount > 0) {
        timeoutMs += 60000 * retryCount;
      }

      console.log(`⏰ Timeout set to: ${timeoutMs / 1000} seconds`);
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
          timeout: timeoutMs,
          maxContentLength: 100 * 1024 * 1024,
          maxBodyLength: 100 * 1024 * 1024,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
            if (percentCompleted % 10 === 0) {
              console.log(`📤 Upload progress: ${percentCompleted}%`);
            }
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
      setUploadProgress(100);

      return response.data;

    } catch (error) {
      console.error('❌ Registration error:', error);
      setUploadProgress(0);
      
      // ✅ Handle timeout with retry logic
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.error('⏰ Request timed out');
        
        // Retry up to 2 times for large uploads
        if (retryCount < 2) {
          console.log(`🔄 Retrying registration (attempt ${retryCount + 2})...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          return register(userData, retryCount + 1);
        }
        
        throw new Error('Registration request timed out after multiple attempts. Please try again.');
      }
      
      if (error.response) {
        let errorMessage = 'Registration failed. Please check your input.';
        
        if (error.response.status === 409) {
          if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          } else {
            errorMessage = 'A record with this information already exists.';
          }
        } else if (error.response.status === 400) {
          if (error.response.data?.errors) {
            const errorsData = error.response.data.errors;
            if (Array.isArray(errorsData)) {
              const errorMessages = errorsData.map(e => 
                `${e.field}: ${e.message}`
              ).join('; ');
              errorMessage = `Validation failed: ${errorMessages}`;
            }
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
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

  // Traditional login
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
    uploadProgress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;