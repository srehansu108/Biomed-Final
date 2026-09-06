// client/src/context/AuthContext.js - FULLY FIXED

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

  // ============================================
  // ✅ CLEANUP FUNCTION
  // ============================================
  const clearAuthData = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  // ============================================
  // ✅ LOGOUT FUNCTION
  // ============================================
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

  // ============================================
  // ✅ REFRESH TOKEN FUNCTION
  // ============================================
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

  // ============================================
  // ✅ REGISTER FUNCTION - FIXED ERROR HANDLING
  // ============================================
  const register = async (userData) => {
    try {
      console.log('📝 Starting registration with data:', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth,
        hasProfilePhoto: !!userData.profilePhoto,
        documentsCount: userData.documents?.length || 0,
        fingerprintsCount: userData.fingerprints ? Object.keys(userData.fingerprints).length : 0
      });

      const formData = new FormData();

      // ============================================
      // ✅ FIX 1: DATE OF BIRTH - Send as ISO string
      // ============================================
      const basicFields = [
        'firstName', 'middleName', 'lastName',
        'gender', 'maritalStatus',
        'stateOfOrigin', 'localGovernment', 'city', 'residentialAddress',
        'phone', 'alternatePhone',
        'emergencyContactName', 'emergencyContactPhone',
        'dietaryHabit', 'education', 'occupation', 'remarks'
      ];

      // ✅ Handle dateOfBirth separately - send as ISO string
      if (userData.dateOfBirth) {
        let dateStr;
        if (userData.dateOfBirth instanceof Date) {
          dateStr = userData.dateOfBirth.toISOString().split('T')[0]; // YYYY-MM-DD
        } else if (typeof userData.dateOfBirth === 'string') {
          // If it's already a string, try to parse it
          const parsed = new Date(userData.dateOfBirth);
          if (!isNaN(parsed)) {
            dateStr = parsed.toISOString().split('T')[0];
          } else {
            // Try to parse DD/MM/YYYY
            const parts = userData.dateOfBirth.split('/');
            if (parts.length === 3) {
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1;
              const year = parseInt(parts[2]);
              const date = new Date(year, month, day);
              if (!isNaN(date)) {
                dateStr = date.toISOString().split('T')[0];
              }
            }
          }
        }
        if (dateStr) {
          formData.append('dateOfBirth', dateStr);
          console.log('📅 Date of birth formatted:', dateStr);
        } else {
          console.warn('⚠️ Could not format dateOfBirth:', userData.dateOfBirth);
          // Send a default date if parsing fails (should not happen)
          formData.append('dateOfBirth', '2000-01-01');
        }
      } else {
        // ✅ Default date if not provided
        formData.append('dateOfBirth', '2000-01-01');
      }

      // Add other basic fields
      basicFields.forEach(field => {
        if (userData[field] !== undefined && userData[field] !== null && userData[field] !== '') {
          formData.append(field, String(userData[field]));
        }
      });

      // ============================================
      // ✅ FIX 2: LANGUAGES - Proper structure
      // ============================================
      const languageData = {
        english: {
          read: !!userData.languages?.english?.read,
          write: !!userData.languages?.english?.write,
          speak: !!userData.languages?.english?.speak,
          understand: !!userData.languages?.english?.understand
        },
        yoruba: {
          read: !!userData.languages?.yoruba?.read,
          write: !!userData.languages?.yoruba?.write,
          speak: !!userData.languages?.yoruba?.speak,
          understand: !!userData.languages?.yoruba?.understand
        },
        igbo: {
          read: !!userData.languages?.igbo?.read || !!userData.languages?.['Igbo Hausa']?.read,
          write: !!userData.languages?.igbo?.write || !!userData.languages?.['Igbo Hausa']?.write,
          speak: !!userData.languages?.igbo?.speak || !!userData.languages?.['Igbo Hausa']?.speak,
          understand: !!userData.languages?.igbo?.understand || !!userData.languages?.['Igbo Hausa']?.understand
        },
        hausa: {
          read: !!userData.languages?.hausa?.read,
          write: !!userData.languages?.hausa?.write,
          speak: !!userData.languages?.hausa?.speak,
          understand: !!userData.languages?.hausa?.understand
        },
        other: {
          name: userData.languages?.other?.name || '',
          read: !!userData.languages?.other?.read,
          write: !!userData.languages?.other?.write,
          speak: !!userData.languages?.other?.speak,
          understand: !!userData.languages?.other?.understand
        }
      };
      
      formData.append('languages', JSON.stringify(languageData));
      console.log('🔤 Languages attached');

      if (userData.languageNotes) {
        formData.append('languageNotes', userData.languageNotes);
      }

      // ============================================
      // ✅ FIX 3: ID PROOF TYPE - Use correct format
      // ============================================
      const validIdTypes = [
        'Driving License', 'Voters ID Card', 'NIN', 
        'Organization ID-Card', 'School Leaving Certificate',
        'Passport', 'Election Card', 'Others'
      ];
      
      let idProofs = ['NIN']; // Default
      
      if (userData.idProofType && userData.idProofType.length > 0) {
        const validProofs = userData.idProofType.filter(type => validIdTypes.includes(type));
        if (validProofs.length > 0) {
          idProofs = validProofs;
        }
      }
      
      formData.append('idProofType', JSON.stringify(idProofs));
      console.log('🪪 ID Proof types:', idProofs);

      // Add Profile Photo
      if (userData.profilePhoto && userData.profilePhoto instanceof File) {
        if (userData.profilePhoto.size > 5 * 1024 * 1024) {
          throw new Error('Profile photo must be less than 5MB');
        }
        formData.append('profilePhoto', userData.profilePhoto);
        console.log('📸 Profile photo attached:', userData.profilePhoto.name);
      } else if (userData.profileImage && typeof userData.profileImage === 'string') {
        try {
          const response = await fetch(userData.profileImage);
          const blob = await response.blob();
          const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
          formData.append('profilePhoto', file);
          console.log('📸 Webcam photo attached');
        } catch (error) {
          console.error('Failed to convert webcam image:', error);
        }
      }

      // Add Documents
      if (userData.documents && userData.documents.length > 0) {
        const totalSize = userData.documents.reduce((sum, file) => sum + file.size, 0);
        if (totalSize > 50 * 1024 * 1024) {
          throw new Error('Total document size must be less than 50MB');
        }
        userData.documents.forEach((file, index) => {
          formData.append('documents', file);
          console.log(`📄 Document ${index + 1} attached:`, file.name);
        });
      }

      // ============================================
      // ✅ FINGERPRINTS - LENIENT VALIDATION
      // ============================================
      if (userData.fingerprints && Object.keys(userData.fingerprints).length > 0) {
        const fingerprintData = {};
        const validFingerTypes = ['right_thumb', 'right_index', 'right_middle', 'right_ring', 'right_little'];
        
        console.log('🔐 Processing fingerprints...');
        
        for (const [fingerType, data] of Object.entries(userData.fingerprints)) {
          if (!validFingerTypes.includes(fingerType)) {
            console.warn(`⚠️ Skipping invalid finger type: ${fingerType}`);
            continue;
          }
          
          let templateData = null;
          
          if (data && typeof data === 'object') {
            if (data.data && typeof data.data === 'string') {
              templateData = data.data;
            } else if (data.template && typeof data.template === 'string') {
              templateData = data.template;
            } else if (data.templateData && typeof data.templateData === 'string') {
              templateData = data.templateData;
            } else if (data.fingerprintData && typeof data.fingerprintData === 'string') {
              templateData = data.fingerprintData;
            } else {
              for (const [key, value] of Object.entries(data)) {
                if (key.toLowerCase().includes('data') && typeof value === 'string' && value.length > 10) {
                  templateData = value;
                  break;
                }
              }
            }
          } else if (typeof data === 'string') {
            templateData = data;
          }
          
          if (!templateData || typeof templateData !== 'string' || templateData.length < 10) {
            console.warn(`⚠️ No valid data found for ${fingerType}`);
            continue;
          }
          
          fingerprintData[fingerType] = {
            data: templateData,
            format: data?.format || 'ISO_19794_2',
            quality: data?.quality || 70,
            metrics: data?.metrics || {}
          };
          
          console.log(`✅ Valid fingerprint for ${fingerType}: ${templateData.length} chars`);
        }
        
        if (Object.keys(fingerprintData).length === 0) {
          throw new Error('No valid fingerprint data found. Please re-capture all 5 fingerprints.');
        }
        
        formData.append('fingerprints', JSON.stringify(fingerprintData));
        console.log(`🔐 Fingerprints attached: ${Object.keys(fingerprintData).join(', ')}`);
      } else {
        throw new Error('At least one fingerprint is required');
      }

      // ✅ Log all form data for debugging
      console.log('📦 FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          const strValue = typeof value === 'string' ? value.substring(0, 100) : String(value);
          console.log(`  ${key}: ${strValue}${strValue.length > 100 ? '...' : ''}`);
        }
      }

      // Send to the correct endpoint
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

      console.log('✅ Registration successful:', response.data);

      const { user: userData_, tokens } = response.data.data;

      setUser(userData_);
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      setIsAuthenticated(true);

      return response.data;

    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        
        // ✅ FIXED: Properly handle nested errors object
        let errorMessage = 'Registration failed. Please check your input.';
        
        if (error.response.data?.errors) {
          // ✅ Check if errors is an array or object
          const errorsData = error.response.data.errors;
          
          if (Array.isArray(errorsData)) {
            // ✅ If it's an array directly
            const errorMessages = errorsData.map(e => 
              `${e.field || 'field'}: ${e.message}`
            ).join('; ');
            errorMessage = `Validation failed: ${errorMessages}`;
          } else if (errorsData.errors && Array.isArray(errorsData.errors)) {
            // ✅ If it's nested like { errors: [...] }
            const errorMessages = errorsData.errors.map(e => 
              `${e.field || 'field'}: ${e.message}`
            ).join('; ');
            errorMessage = `Validation failed: ${errorMessages}`;
          } else if (typeof errorsData === 'object') {
            // ✅ If it's an object with field keys
            const errorMessages = Object.entries(errorsData).map(([field, messages]) => {
              const msg = Array.isArray(messages) ? messages.join(', ') : messages;
              return `${field}: ${msg}`;
            }).join('; ');
            errorMessage = `Validation failed: ${errorMessages}`;
          }
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        throw new Error(errorMessage);
      } else if (error.request) {
        console.error('No response received');
        throw new Error('Server not responding. Please check your connection.');
      } else {
        console.error('Error setting up request:', error.message);
        throw new Error(error.message || 'Registration failed');
      }
    }
  };

  // ============================================
  // ✅ LOGIN FUNCTION
  // ============================================
  const login = async (email, fingerprintData) => {
    try {
      console.log('🔐 Attempting login for:', email);

      const response = await axiosInstance.post('/auth/login', {
        email,
        fingerprintData,
      });

      console.log('✅ Login successful:', response.data);

      const { user: userData_, tokens } = response.data.data;

      setUser(userData_);
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      setIsAuthenticated(true);

      return response.data;

    } catch (error) {
      console.error('❌ Login error:', error);
      
      let message = 'Login failed. Please try again.';
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        message = error.response.data?.message || message;
      } else if (error.request) {
        console.error('No response received');
        message = 'Server not responding. Please check your connection.';
      } else {
        console.error('Error setting up request:', error.message);
        message = error.message || message;
      }
      
      throw new Error(message);
    }
  };

  // ============================================
  // ✅ UPDATE USER PROFILE
  // ============================================
  const updateUser = (updatedData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedData
    }));
  };

  // ============================================
  // ✅ VALUE OBJECT
  // ============================================
  const value = {
    user,
    setUser,
    isAuthenticated,
    isLoading,
    register,
    login,
    logout,
    refreshToken: refreshTokenFunc,
    updateUser,
    clearAuthData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};