// client/src/components/fingerprint/FiveFingerCapture.jsx - COMPLETE FIX

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FingerprintVisualizer } from './FingerprintVisualizer';
import { useFingerprintWebSocket } from '../../hooks/useFingerprintWebSocket';
import { QualityIndicator } from './QualityIndicator';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';

const FINGER_NAMES = {
  right_thumb: 'Right Thumb',
  right_index: 'Right Index',
  right_middle: 'Right Middle',
  right_ring: 'Right Ring',
  right_little: 'Right Little',
};

const FINGER_ORDER = ['right_thumb', 'right_index', 'right_middle', 'right_ring', 'right_little'];

export const FiveFingerCapture = ({ 
  onComplete, 
  onProgress, 
  onError,
  disabled = false,
  className = '' 
}) => {
  const {
    isConnected,
    isAuthenticated,
    isCapturing,
    captureProgress,
    fingerprintData,
    error: wsError,
    scannerStatus,
    startCapture,
    stopCapture,
    resetFingerprintData,
    clearError,
  } = useFingerprintWebSocket();

  const [currentFingerIndex, setCurrentFingerIndex] = useState(0);
  const [capturedFingers, setCapturedFingers] = useState({});
  const [localError, setLocalError] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [currentFingerData, setCurrentFingerData] = useState(null);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);

  const currentFinger = FINGER_ORDER[currentFingerIndex];
  const progress = (currentFingerIndex / FINGER_ORDER.length) * 100;

  // ✅ Get scanner status display
  const getScannerDisplay = useCallback(() => {
    if (!isConnected) {
      return { text: '🔴 Scanner Disconnected', color: 'text-red-500', bg: 'bg-red-50' };
    }
    if (scannerStatus.deviceConnected) {
      const model = scannerStatus.deviceInfo?.Model || 'Scanner';
      return { text: `🟢 ${model} (Online)`, color: 'text-green-500', bg: 'bg-green-50' };
    }
    if (scannerStatus.isSimulated) {
      return { text: '🟡 Simulated Mode (No Device)', color: 'text-yellow-500', bg: 'bg-yellow-50' };
    }
    return { text: '🔴 Scanner Offline', color: 'text-red-500', bg: 'bg-red-50' };
  }, [isConnected, scannerStatus]);

  const scannerDisplay = getScannerDisplay();

  // ✅ Handle fingerprint data from WebSocket - FIXED
  useEffect(() => {
    if (!fingerprintData) return;

    console.log('📥 Raw fingerprint data received:', fingerprintData);

    // ✅ Extract the finger type and data
    const fingerType = fingerprintData.fingerType || 
                       fingerprintData.fingerType || 
                       currentFinger;

    // ✅ Ensure we have the data property
    let templateData = fingerprintData.data || 
                       fingerprintData.template || 
                       fingerprintData.templateData;

    // ✅ If data is base64 encoded, keep it as is
    if (templateData && typeof templateData === 'string') {
      // Data is already a string (base64 or raw)
      console.log(`✅ Valid data found for ${fingerType}:`, templateData.substring(0, 50) + '...');
    } else if (templateData && typeof templateData === 'object') {
      // Data is an object, convert to string
      templateData = JSON.stringify(templateData);
    } else {
      console.error(`❌ No valid data found for ${fingerType}`);
      setLocalError(`No fingerprint data received for ${FINGER_NAMES[fingerType]}`);
      return;
    }

    // ✅ Create proper fingerprint data structure
    const capturedData = {
      data: templateData,  // ✅ This is what AuthContext expects
      format: fingerprintData.format || 'ISO_19794_2',
      quality: fingerprintData.quality || 70,
      metrics: fingerprintData.metrics || {},
      imageData: fingerprintData.imageData || null,
      minutiae: fingerprintData.minutiae || [],
    };

    console.log(`✅ Captured ${fingerType} with quality: ${capturedData.quality}%`);
    console.log(`📊 Data length: ${capturedData.data.length} characters`);

    // ✅ Store current finger data
    setCurrentFingerData(capturedData);
    
    // ✅ Add to captured fingers
    const updatedFingers = {
      ...capturedFingers,
      [fingerType]: capturedData,  // ✅ Structure matches AuthContext expectation
    };
    setCapturedFingers(updatedFingers);

    // ✅ Auto-advance to next finger
    if (!isAutoAdvancing) {
      setIsAutoAdvancing(true);
      
      const currentIndex = FINGER_ORDER.indexOf(fingerType);
      
      if (currentIndex < FINGER_ORDER.length - 1) {
        // Move to next finger after delay
        const nextIndex = currentIndex + 1;
        setTimeout(() => {
          setCurrentFingerIndex(nextIndex);
          setCurrentFingerData(null);
          setIsAutoAdvancing(false);
          resetFingerprintData();
        }, 1500);
      } else {
        // All fingers captured
        setIsComplete(true);
        setTimeout(() => {
          // ✅ Send complete data with proper structure
          console.log('🎉 All fingers captured:', updatedFingers);
          onComplete?.(updatedFingers);
        }, 500);
      }
    }
  }, [fingerprintData, currentFinger, capturedFingers, onComplete, resetFingerprintData, isAutoAdvancing]);

  // ✅ Handle WebSocket errors
  useEffect(() => {
    if (wsError) {
      setLocalError(wsError);
      onError?.(new Error(wsError));
    }
  }, [wsError, onError]);

  // ✅ Update progress
  useEffect(() => {
    if (onProgress) {
      onProgress({
        progress: progress + (captureProgress / FINGER_ORDER.length),
        capturedCount: Object.keys(capturedFingers).length,
        capturedFingers: capturedFingers,
        currentFinger: currentFinger,
        isCapturing: isCapturing,
        status: isComplete ? 'complete' : isCapturing ? 'capturing' : 'ready',
      });
    }
  }, [capturedFingers, currentFingerIndex, progress, isCapturing, captureProgress, isComplete]);

  // ✅ Handle start capture
  const handleStartCapture = () => {
    setLocalError('');
    clearError();
    console.log(`🔍 Starting capture for: ${currentFinger}`);
    startCapture(currentFinger);
  };

  // ✅ Handle stop capture
  const handleStopCapture = () => {
    stopCapture();
  };

  // ✅ Handle retry for current finger
  const handleRetry = () => {
    setCurrentFingerData(null);
    setLocalError('');
    clearError();
    // Remove current finger from captured list
    const updated = { ...capturedFingers };
    delete updated[currentFinger];
    setCapturedFingers(updated);
    resetFingerprintData();
  };

  // ✅ Reset all fingerprints
  const handleReset = () => {
    setCapturedFingers({});
    setCurrentFingerIndex(0);
    setCurrentFingerData(null);
    setIsComplete(false);
    setIsAutoAdvancing(false);
    resetFingerprintData();
    setLocalError('');
    clearError();
  };

  const allFingersCaptured = Object.keys(capturedFingers).length === FINGER_ORDER.length;

  // ✅ Render
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Scanner Status Display */}
      <div className={`p-3 rounded-lg border ${scannerDisplay.bg} border-gray-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{scannerDisplay.text.split(' ')[0]}</span>
            <span className={`font-medium ${scannerDisplay.color}`}>
              {scannerDisplay.text}
            </span>
          </div>
          {scannerStatus.deviceInfo && (
            <span className="text-xs text-gray-500">
              {scannerStatus.deviceInfo.Manufacturer} {scannerStatus.deviceInfo.Model}
            </span>
          )}
        </div>
        {scannerStatus.isSimulated && !scannerStatus.deviceConnected && (
          <p className="text-xs text-yellow-600 mt-1">
            💡 No physical scanner detected. Using simulated mode for development.
          </p>
        )}
        {scannerStatus.deviceConnected && (
          <p className="text-xs text-green-600 mt-1">
            ✅ Fingerprint scanner is ready. Place your finger on the device.
          </p>
        )}
      </div>

      {/* Fingerprint Visualizer */}
      <div className="relative">
        <FingerprintVisualizer
          imageData={currentFingerData?.imageData || null}
          minutiae={currentFingerData?.minutiae || []}
          quality={currentFingerData?.quality || 0}
          isCapturing={isCapturing}
          progress={captureProgress}
          width={400}
          height={400}
          showMinutiae={true}
          showHeatmap={true}
        />

        {/* Status Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isConnected ? 'text-white/80' : 'text-red-400'}`}>
              {!isConnected ? '🔴 Scanner Disconnected' : 
               scannerStatus.deviceConnected ? '🟢 Scanner Online' : 
               scannerStatus.isSimulated ? '🟡 Simulated Mode' : 
               '🔴 Scanner Offline'}
            </span>
            {isCapturing && (
              <span className="text-xs text-blue-300 animate-pulse">
                Scanning... {Math.round(captureProgress)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progress: {Object.keys(capturedFingers).length} of {FINGER_ORDER.length} fingers
          </span>
          <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-biomed-green transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Finger Status */}
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-gray-900">
            {isComplete
              ? '✅ All Fingers Captured!'
              : `Step ${currentFingerIndex + 1}: ${FINGER_NAMES[currentFinger]}`}
          </h4>
          {isComplete && (
            <Button variant="secondary" size="sm" onClick={handleReset}>
              Reset All
            </Button>
          )}
        </div>

        {!isComplete && (
          <>
            {currentFingerData ? (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-medium text-green-800">Captured!</p>
                      <p className="text-sm text-green-700">
                        Quality: {Math.round(currentFingerData.quality)}%
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Data size: {currentFingerData.data.length} characters
                      </p>
                    </div>
                  </div>
                </div>
                <QualityIndicator quality={currentFingerData.quality} />
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isAutoAdvancing}
                >
                  Rescan
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={handleStartCapture}
                  isLoading={isCapturing}
                  disabled={isCapturing || !isConnected || disabled || isAutoAdvancing}
                  className="w-full"
                  size="lg"
                >
                  {isCapturing
                    ? `Scanning ${FINGER_NAMES[currentFinger]}...`
                    : !isConnected
                    ? '🔴 Scanner Not Connected'
                    : `Capture ${FINGER_NAMES[currentFinger]}`}
                </Button>

                {isCapturing && (
                  <Button variant="secondary" onClick={handleStopCapture} className="w-full">
                    Stop Capture
                  </Button>
                )}
              </div>
            )}

            {localError && <Alert type="error" message={localError} className="mt-3" />}
          </>
        )}

        {isComplete && allFingersCaptured && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <h5 className="font-semibold text-green-800">All Fingers Captured!</h5>
                <p className="text-sm text-green-700">Quality scores are good. Ready to save.</p>
                <p className="text-xs text-green-600 mt-1">
                  Total data size: {Object.values(capturedFingers).reduce((sum, f) => sum + f.data.length, 0)} characters
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Finger status grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {FINGER_ORDER.map((finger, index) => {
          const isCaptured = !!capturedFingers[finger];
          const isCurrent = index === currentFingerIndex;

          return (
            <div
              key={finger}
              className={`
                p-2 rounded-lg text-center transition-all
                ${isCaptured ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300'}
                ${isCurrent && !isCaptured ? 'border-2 border-biomed-green animate-pulse' : 'border'}
                ${isCaptured ? 'opacity-100' : 'opacity-70'}
                ${disabled ? 'opacity-50' : ''}
              `}
            >
              <div className="text-sm font-medium text-gray-700 truncate">
                {FINGER_NAMES[finger].split(' ').pop()}
              </div>
              <div className="mt-1">
                {isCaptured ? (
                  <span className="text-green-600">✅</span>
                ) : isCurrent ? (
                  <span className="text-blue-600">🔄</span>
                ) : (
                  <span className="text-gray-400">⏳</span>
                )}
              </div>
              {isCaptured && capturedFingers[finger] && (
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(capturedFingers[finger].quality)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};