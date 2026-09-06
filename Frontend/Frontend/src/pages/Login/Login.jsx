// client/src/pages/Login/FingerprintLogin.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFingerprintWebSocket } from '../../hooks/useFingerprintWebSocket';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { QualityIndicator } from '../../components/fingerprint/QualityIndicator';
import { FingerprintScanner } from '../../components/fingerprint/FingerprintScanner';
import { FingerSelector } from '../../components/fingerprint/FingerSelector';
import { useFingerprint } from '../../hooks/useFingerprint';
import axiosInstance from '../../api/axiosConfig';

// ✅ Finger types with display names and icons
const FINGER_TYPES = [
  { id: 'right_thumb', label: 'Right Thumb', icon: '👍', description: 'Right hand thumb' },
  { id: 'right_index', label: 'Right Index', icon: '👆', description: 'Right hand index finger' },
  { id: 'right_middle', label: 'Right Middle', icon: '🖕', description: 'Right hand middle finger' },
  { id: 'right_ring', label: 'Right Ring', icon: '💍', description: 'Right hand ring finger' },
  { id: 'right_little', label: 'Right Little', icon: '🤙', description: 'Right hand little finger' },
  { id: 'left_thumb', label: 'Left Thumb', icon: '👍', description: 'Left hand thumb' },
  { id: 'left_index', label: 'Left Index', icon: '👆', description: 'Left hand index finger' },
  { id: 'left_middle', label: 'Left Middle', icon: '🖕', description: 'Left hand middle finger' },
  { id: 'left_ring', label: 'Left Ring', icon: '💍', description: 'Left hand ring finger' },
  { id: 'left_little', label: 'Left Little', icon: '🤙', description: 'Left hand little finger' }
];

const FingerprintLogin = () => {
  const navigate = useNavigate();
  const { loginWithFingerprint: authLoginWithFingerprint, isAuthenticated } = useAuth();
  const { captureFingerprint, isCapturing, status, error: captureError } = useFingerprint();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fingerprintData, setFingerprintData] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle');
  const [attempts, setAttempts] = useState(0);
  const [scanMessage, setScanMessage] = useState('Select a finger to begin');
  const [matchInfo, setMatchInfo] = useState(null);
  const [selectedFinger, setSelectedFinger] = useState(null);
  const [selectedFingerType, setSelectedFingerType] = useState(null);

  // WebSocket for real-time scanner status
  const {
    isConnected: wsConnected,
    scannerStatus,
    isScannerReady,
  } = useFingerprintWebSocket();

  // ✅ Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // ✅ Handle finger selection
  const handleFingerSelect = (finger) => {
    setSelectedFinger(finger);
    setSelectedFingerType(finger.id);
    setScanStatus('idle');
    setError('');
    setMatchInfo(null);
    setAttempts(0);
    setScanMessage(`Selected: ${finger.label}. Click "Scan" to start.`);
  };

  // ✅ Handle manual scan
  const handleManualScan = async () => {
    if (!selectedFinger) {
      setError('Please select a finger first');
      return;
    }
    
    if (isCapturing || isLoading) return;

    setScanStatus('scanning');
    setError('');
    setMatchInfo(null);
    setScanMessage(`🔍 Scanning ${selectedFinger.label}...`);

    try {
      const result = await captureFingerprint(selectedFinger.id);
      
      if (result.success) {
        setFingerprintData(result.data);
        setScanStatus('success');
        setScanMessage(`✅ ${selectedFinger.label} captured! Quality: ${result.quality}%`);
        
        // ✅ Auto-login after capture
        await handleLogin(result.data);
      } else {
        setScanStatus('error');
        setError(result.error || 'Failed to capture fingerprint');
        setScanMessage(`❌ Failed to capture ${selectedFinger.label}. Please try again.`);
        
        // ✅ Retry
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts < 3) {
          setTimeout(() => {
            setScanStatus('idle');
            setScanMessage(`Please try again with ${selectedFinger.label} (Attempt ${newAttempts + 1}/3)`);
          }, 2000);
        } else {
          setScanMessage(`❌ Too many failed attempts with ${selectedFinger.label}. Try a different finger.`);
        }
      }
    } catch (err) {
      setScanStatus('error');
      setError(err.message || 'An error occurred during fingerprint capture');
      setScanMessage('❌ Error: ' + err.message);
    }
  };

  // ✅ Handle login with captured fingerprint
  const handleLogin = async (fingerprint) => {
    setIsLoading(true);
    setError('');
    setScanMessage('🔐 Verifying fingerprint...');

    try {
      console.log('🔑 Attempting fingerprint-only login...');
      console.log(`🖐️  Using finger: ${selectedFinger?.label || 'Unknown'}`);
      
      // ✅ Send fingerprint data with selected finger type
      const response = await loginWithFingerprintAPI(fingerprint, selectedFingerType);
      
      if (response.success) {
        const { user, match } = response.data;
        
        setMatchInfo({
          user: `${user.firstName} ${user.lastName}`,
          fingerType: match.fingerType,
          confidence: match.confidence,
          displayName: FINGER_TYPES.find(f => f.id === match.fingerType)?.label || match.fingerType,
          isPreferredMatch: match.isPreferredMatch
        });
        
        setScanMessage(`✅ Welcome ${user.firstName}!`);
        
        // ✅ Store user data in auth context
        authLoginWithFingerprint(response.data);
        
        // ✅ Navigate to dashboard after brief delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      setScanMessage('❌ ' + err.message);
      setScanStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ API call for fingerprint-only login
  const loginWithFingerprintAPI = async (fingerprintData, fingerType) => {
    try {
      const response = await axiosInstance.post('/auth/login/fingerprint', {
        fingerprintData,
        fingerType, // ✅ Send the selected finger type for optimization
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Login failed');
      }
      throw error;
    }
  };

  // ✅ Get scanner status display
  const getScannerStatusDisplay = () => {
    if (!wsConnected) {
      return {
        icon: '🔴',
        title: 'Scanner Disconnected',
        description: 'Please connect the fingerprint scanner',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
      };
    }
    if (!scannerStatus.isReady) {
      return {
        icon: '⏳',
        title: 'Initializing Scanner...',
        description: 'Please wait',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
      };
    }
    if (scannerStatus.isSimulated) {
      return {
        icon: '🔵',
        title: 'Simulated Scanner',
        description: 'Using software simulation (demo mode)',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      };
    }
    return {
      icon: '🟢',
      title: 'Scanner Ready',
      description: 'Select a finger and click Scan',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    };
  };

  const scannerStatusDisplay = getScannerStatusDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-biomed-green rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-biomed-green">BioMed</h1>
          <p className="text-gray-600 mt-1">Fingerprint Authentication System</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}

        {/* Scanner Status */}
        <div className={`p-4 rounded-lg mb-6 ${scannerStatusDisplay.bgColor}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{scannerStatusDisplay.icon}</span>
            <div>
              <h4 className={`font-semibold ${scannerStatusDisplay.color}`}>
                {scannerStatusDisplay.title}
              </h4>
              <p className="text-sm text-gray-600">{scannerStatusDisplay.description}</p>
            </div>
          </div>
        </div>

        {/* ✅ Finger Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Select Finger to Scan
            </label>
            {selectedFinger && (
              <span className="text-xs text-green-600 font-medium">
                Selected: {selectedFinger.label}
              </span>
            )}
          </div>
          <FingerSelector
            fingers={FINGER_TYPES}
            selectedFinger={selectedFinger}
            onSelect={handleFingerSelect}
            disabled={isCapturing || isLoading}
          />
        </div>

        {/* Selected Finger Preview */}
        {selectedFinger && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedFinger.icon}</span>
              <div>
                <p className="font-semibold text-blue-800">
                  {selectedFinger.label}
                </p>
                <p className="text-sm text-blue-600">
                  {selectedFinger.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Fingerprint Scanner UI */}
        <div className="mb-6">
          <FingerprintScanner
            status={scanStatus}
            isCapturing={isCapturing}
            onScan={handleManualScan}
            message={scanMessage}
            attempts={attempts}
            maxAttempts={3}
            selectedFinger={selectedFinger}
          />
        </div>

        {/* Quality Indicator */}
        {scanStatus === 'success' && status?.quality && (
          <div className="mb-4">
            <QualityIndicator quality={status.quality} />
          </div>
        )}

        {/* Match Info */}
        {matchInfo && (
          <div className={`rounded-lg p-4 mb-4 ${
            matchInfo.isPreferredMatch !== false 
              ? 'bg-green-50 border border-green-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-green-800">
                  Welcome back, {matchInfo.user}!
                </p>
                <p className="text-sm text-green-600">
                  Matched on: {matchInfo.displayName || matchInfo.fingerType.replace('_', ' ').toUpperCase()}
                  {' '}· Confidence: {Math.round(matchInfo.confidence * 100)}%
                </p>
                {!matchInfo.isPreferredMatch && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ Matched with a different finger than selected
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scan Button */}
        <Button
          onClick={handleManualScan}
          isLoading={isCapturing || isLoading}
          disabled={!selectedFinger || !isScannerReady || isCapturing || isLoading}
          className="w-full"
          size="lg"
          variant={selectedFinger ? 'primary' : 'secondary'}
        >
          {isCapturing ? (
            '🔍 Scanning...'
          ) : isLoading ? (
            '⏳ Verifying...'
          ) : selectedFinger ? (
            `🖐️ Scan ${selectedFinger.label}`
          ) : (
            '👆 Select a Finger First'
          )}
        </Button>

        {/* Keyboard Shortcut */}
        <div className="text-center mt-3">
          <p className="text-xs text-gray-400">
            Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Space</kbd> or 
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Enter</kbd> to scan
          </p>
        </div>

        {/* Demo Mode Notice */}
        {scannerStatus.isSimulated && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-700 text-center">
              ⚠️ Running in demonstration mode. Simulated fingerprint data will be used.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            Secure biometric authentication • v2.0
          </p>
        </div>
      </Card>
    </div>
  );
};

export default FingerprintLogin;