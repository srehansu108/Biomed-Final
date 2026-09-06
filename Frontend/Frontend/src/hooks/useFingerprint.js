// client/src/hooks/useFingerprint.js

import { useState } from 'react';
import axiosInstance from '../api/axiosConfig';

export const useFingerprint = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  // ✅ Capture fingerprint - Works with real scanner or simulation
  const captureFingerprint = async (fingerType = 'right_thumb') => {
    setIsCapturing(true);
    setError(null);
    setStatus({ status: 'scanning', message: 'Please place your finger on the scanner...' });

    try {
      // ✅ Check if we have a real scanner
      const hasScanner = await checkScannerAvailability();
      
      if (hasScanner) {
        // 🔴 REPLACE THIS WITH YOUR ACTUAL SCANNER SDK
        // Example with MFS100 SDK:
        // const client = new CaptureFinger();
        // if (client.data.AnsiTemplate) {
        //   const result = {
        //     success: true,
        //     fingerType: fingerType,
        //     quality: client.data.QualityScore || 80,
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
        
        // ⚠️ For now, fallback to simulation
        return await simulateCapture(fingerType);
      } else {
        // ✅ Use simulated capture
        return await simulateCapture(fingerType);
      }
      
    } catch (err) {
      setError(err.message || 'Failed to capture fingerprint');
      setStatus({ status: 'error', message: err.message });
      return { success: false, error: err.message };
    } finally {
      setIsCapturing(false);
    }
  };

  // ✅ Check if scanner is available
  const checkScannerAvailability = async () => {
    try {
      // Check WebSocket connection status
      const wsStatus = localStorage.getItem('scannerStatus');
      if (wsStatus) {
        const status = JSON.parse(wsStatus);
        return status.isReady && !status.isSimulated;
      }
      return false;
    } catch {
      return false;
    }
  };

  // ✅ Simulated capture (works without hardware)
  const simulateCapture = async (fingerType) => {
    // Simulate scanning delay
    setStatus({ status: 'scanning', message: 'Waiting for finger placement...' });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setStatus({ status: 'scanning', message: 'Finger detected, capturing...' });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setStatus({ status: 'scanning', message: 'Processing fingerprint...' });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Simulate successful capture with random quality
    const quality = Math.floor(Math.random() * 20) + 75; // 75-95
    
    // Simulate occasional failure (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Poor quality fingerprint. Please clean your finger and try again.');
    }
    
    const minutiaeCount = Math.floor(Math.random() * 50) + 50;
    const minutiae = [];
    for (let i = 0; i < minutiaeCount; i++) {
      minutiae.push({
        x: 50 + Math.random() * 300,
        y: 50 + Math.random() * 300,
        angle: Math.random() * Math.PI * 2,
        type: Math.random() > 0.6 ? 'ridge_ending' : 'bifurcation',
        quality: 60 + Math.random() * 40
      });
    }

    const template = JSON.stringify({
      format: 'ISO_19794_2',
      version: '1.0',
      minutiae: minutiae,
      fingerType,
      imageQuality: quality,
      capturedAt: new Date().toISOString()
    });

    const result = {
      success: true,
      fingerType: fingerType,
      quality: quality,
      data: Buffer.from(template).toString('base64'),
      metrics: {
        imageClarity: quality,
        minutiaePoints: minutiaeCount,
        livenessCheck: true,
        overallQuality: quality,
        nfiq: quality > 85 ? 1 : quality > 70 ? 2 : 3,
      },
    };

    setStatus({ status: 'success', quality: result.quality });
    return result;
  };

  // ✅ Verify fingerprint
  const verifyFingerprint = async (userId, fingerprintData) => {
    setIsVerifying(true);
    setError(null);
    setStatus({ status: 'verifying', message: 'Verifying fingerprint...' });

    try {
      const response = await axiosInstance.post('/auth/verify-fingerprint', {
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

  // ✅ Enroll fingerprint
  const enrollFingerprint = async (fingerType, fingerprintData) => {
    setIsCapturing(true);
    setError(null);
    setStatus({ status: 'scanning', message: 'Enrolling fingerprint...' });

    try {
      const response = await axiosInstance.post('/fingerprints/enroll', {
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

  // ✅ Get user's fingerprints
  const getMyFingerprints = async () => {
    try {
      const response = await axiosInstance.get('/fingerprints/my-fingerprints');
      return response.data.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch fingerprints';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // ✅ Delete fingerprint
  const deleteFingerprint = async (fingerprintId) => {
    try {
      await axiosInstance.delete(`/fingerprints/${fingerprintId}`);
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
    checkScannerAvailability,
  };
};