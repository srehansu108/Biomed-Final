import { useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

export const useFingerprint = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  // ✅ Updated: Real fingerprint capture with scanner SDK
  const captureFingerprint = async (fingerType = 'right_thumb') => {
    setIsCapturing(true);
    setError(null);
    setStatus({ status: 'scanning', message: 'Please place your finger on the scanner...' });

    try {
      // 🔴 REPLACE THIS SECTION WITH YOUR ACTUAL SCANNER SDK
      // Example with MFS100 SDK:
      // const client = new CaptureFinger();
      // if (client.data.AnsiTemplate) {
      //   const result = {
      //     success: true,
      //     fingerType: fingerType,
      //     quality: calculateQuality(client.data),
      //     data: client.data.AnsiTemplate,
      //     metrics: {
      //       imageClarity: client.data.ImageQuality || 0,
      //       minutiaePoints: client.data.MinutiaeCount || 0,
      //       livenessCheck: true,
      //       overallQuality: client.data.QualityScore || 0,
      //     },
      //   };
      //   setStatus({ status: 'success', quality: result.quality });
      //   return result;
      // } else {
      //   throw new Error('No fingerprint detected. Please try again.');
      // }

      // ⚠️ TEMPORARY: Simulated capture (remove this when using real scanner)
      // This simulates waiting for user to place finger
      setStatus({ status: 'scanning', message: 'Waiting for finger placement...' });
      
      // Simulate scanning delay (3 seconds)
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      // Simulate successful capture with random quality
      const quality = Math.floor(Math.random() * 30) + 70;
      
      // Simulate occasional failure (20% chance)
      if (Math.random() < 0.2) {
        throw new Error('Poor quality fingerprint. Please clean your finger and try again.');
      }
      
      const result = {
        success: true,
        fingerType: fingerType,
        quality: quality,
        data: `FINGER_TEMPLATE_${Date.now()}`,
        metrics: {
          imageClarity: Math.floor(Math.random() * 20) + 80,
          minutiaePoints: Math.floor(Math.random() * 50) + 50,
          livenessCheck: true,
          overallQuality: quality,
        },
      };

      setStatus({ status: 'success', quality: result.quality });
      return result;
      
    } catch (err) {
      setError(err.message || 'Failed to capture fingerprint');
      setStatus({ status: 'error', message: err.message });
      return { success: false, error: err.message };
    } finally {
      setIsCapturing(false);
    }
  };

  // Verify fingerprint
  const verifyFingerprint = async (userId, fingerprintData) => {
    setIsVerifying(true);
    setError(null);
    setStatus({ status: 'verifying', message: 'Verifying fingerprint...' });

    try {
      const response = await axiosInstance.post(ENDPOINTS.AUTH.VERIFY_FINGERPRINT, {
        userId,
        fingerprintData,
      });

      const result = response.data.data;
      setStatus({ 
        status: result.verified ? 'success' : 'failure',
        matchScore: result.matchScore,
        message: result.verified ? '✅ Fingerprint verified!' : '❌ Fingerprint does not match',
      });
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Verification failed';
      setError(errorMsg);
      setStatus({ status: 'error', message: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      setIsVerifying(false);
    }
  };

  // Enroll fingerprint
  const enrollFingerprint = async (fingerType, fingerprintData) => {
    setIsCapturing(true);
    setError(null);
    setStatus({ status: 'scanning', message: 'Enrolling fingerprint...' });

    try {
      const response = await axiosInstance.post(ENDPOINTS.FINGERPRINTS.ENROLL, {
        fingerType,
        fingerprintData,
      });
      setStatus({ status: 'success', message: '✅ Fingerprint enrolled successfully!' });
      return response.data.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Enrollment failed';
      setError(errorMsg);
      setStatus({ status: 'error', message: errorMsg });
      throw new Error(errorMsg);
    } finally {
      setIsCapturing(false);
    }
  };

  // Get user's fingerprints
  const getMyFingerprints = async () => {
    try {
      const response = await axiosInstance.get(ENDPOINTS.FINGERPRINTS.GET_MY_FINGERPRINTS);
      return response.data.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch fingerprints';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Delete fingerprint
  const deleteFingerprint = async (fingerprintId) => {
    try {
      await axiosInstance.delete(ENDPOINTS.FINGERPRINTS.DELETE(fingerprintId));
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete fingerprint';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  return {
    captureFingerprint,
    verifyFingerprint,
    enrollFingerprint,
    getMyFingerprints,
    deleteFingerprint,
    isCapturing,
    isVerifying,
    error,
    status,
  };
};