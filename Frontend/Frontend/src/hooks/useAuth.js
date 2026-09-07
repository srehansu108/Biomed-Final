// client/src/hooks/useAuth.js

import { useContext } from 'react';
import AuthContext from '../context/AuthContext'; // ✅ Default import

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ✅ Convenience hook for fingerprint login
export const useFingerprintLogin = () => {
  const { loginWithFingerprint } = useAuth();
  
  const handleFingerprintLogin = async (fingerprintData) => {
    try {
      const result = await loginWithFingerprint(fingerprintData);
      return result;
    } catch (error) {
      console.error('Fingerprint login error:', error);
      throw error;
    }
  };
  
  return {
    handleFingerprintLogin,
  };
};