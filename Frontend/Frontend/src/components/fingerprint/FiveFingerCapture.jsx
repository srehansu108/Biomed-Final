// client/src/components/fingerprint/FiveFingerCapture.jsx - COMPLETE WITH SCANNER MODE INDICATOR

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FingerprintVisualizer } from './FingerprintVisualizer';
import { useFingerprintWebSocket } from '../../hooks/useFingerprintWebSocket';
import { QualityIndicator } from './QualityIndicator';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { ScannerModeIndicator } from './ScannerModeIndicator';

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
  const [captureSource, setCaptureSource] = useState('unknown');
  
  // ✅ Popup state
  const [showModePopup, setShowModePopup] = useState(true);
  const [popupClosed, setPopupClosed] = useState(false);

  const currentFinger = FINGER_ORDER[currentFingerIndex];
  const progress = (currentFingerIndex / FINGER_ORDER.length) * 100;

  // ✅ FORCE POPUP TO SHOW ON MOUNT
  useEffect(() => {
    console.log('📱 FiveFingerCapture mounted - showing scanner mode popup');
    setShowModePopup(true);
    setPopupClosed(false);
  }, []);

  // ✅ Get scanner status display
  const getScannerDisplay = useCallback(() => {
    if (!isConnected) {
      return { 
        text: '🔴 Scanner Disconnected', 
        color: 'text-red-500', 
        bg: 'bg-red-50',
        mode: 'offline'
      };
    }
    if (scannerStatus.deviceConnected && !scannerStatus.isSimulated) {
      const model = scannerStatus.deviceInfo?.Model || 'Scanner';
      setCaptureSource('real_device');
      return { 
        text: `🟢 ${model} (Real Scanner)`, 
        color: 'text-green-500', 
        bg: 'bg-green-50',
        mode: 'real'
      };
    }
    if (scannerStatus.isSimulated) {
      setCaptureSource('simulated');
      return { 
        text: '🟡 Simulated Mode (No Device)', 
        color: 'text-yellow-500', 
        bg: 'bg-yellow-50',
        mode: 'simulated'
      };
    }
    setCaptureSource('unknown');
    return { 
      text: '🔴 Scanner Offline', 
      color: 'text-red-500', 
      bg: 'bg-red-50',
      mode: 'offline'
    };
  }, [isConnected, scannerStatus]);

  const scannerDisplay = getScannerDisplay();

  // ✅ Handle fingerprint data from WebSocket
  useEffect(() => {
    if (!fingerprintData) return;

    console.log('📥 Raw fingerprint data received:', fingerprintData);
    console.log('🔍 Capture source from data:', fingerprintData.source || 'unknown');

    const fingerType = fingerprintData.fingerType || currentFinger;

    // ✅ Extract template data
    let templateData = fingerprintData.data || 
                       fingerprintData.template || 
                       fingerprintData.templateData;

    if (templateData && typeof templateData === 'string') {
      console.log(`✅ Valid data found for ${fingerType}:`, templateData.substring(0, 50) + '...');
    } else if (templateData && typeof templateData === 'object') {
      templateData = JSON.stringify(templateData);
    } else {
      console.error(`❌ No valid data found for ${fingerType}`);
      setLocalError(`No fingerprint data received for ${FINGER_NAMES[fingerType]}`);
      return;
    }

    // ✅ Track capture source
    const source = fingerprintData.source || scannerDisplay.mode || 'unknown';
    setCaptureSource(source);

    const capturedData = {
      data: templateData,
      format: fingerprintData.format || 'ISO_19794_2',
      quality: fingerprintData.quality || 70,
      metrics: fingerprintData.metrics || {},
      imageData: fingerprintData.imageData || null,
      minutiae: fingerprintData.minutiae || [],
      source: source,
      sourceLabel: source === 'real_device' ? '🔴 REAL SCANNER' : '🟡 SIMULATED'
    };

    console.log(`✅ Captured ${fingerType} with quality: ${capturedData.quality}%`);
    console.log(`📊 Data length: ${capturedData.data.length} characters`);
    console.log(`🔍 Source: ${capturedData.sourceLabel}`);

    setCurrentFingerData(capturedData);
    
    const updatedFingers = {
      ...capturedFingers,
      [fingerType]: capturedData,
    };
    setCapturedFingers(updatedFingers);

    if (!isAutoAdvancing) {
      setIsAutoAdvancing(true);
      
      const currentIndex = FINGER_ORDER.indexOf(fingerType);
      
      if (currentIndex < FINGER_ORDER.length - 1) {
        const nextIndex = currentIndex + 1;
        setTimeout(() => {
          setCurrentFingerIndex(nextIndex);
          setCurrentFingerData(null);
          setIsAutoAdvancing(false);
          resetFingerprintData();
        }, 1500);
      } else {
        setIsComplete(true);
        setTimeout(() => {
          console.log('🎉 All fingers captured:', updatedFingers);
          console.log('📊 Capture source:', source);
          onComplete?.(updatedFingers);
        }, 500);
      }
    }
  }, [fingerprintData, currentFinger, capturedFingers, onComplete, resetFingerprintData, isAutoAdvancing, scannerDisplay.mode]);

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
        source: captureSource,
        sourceLabel: captureSource === 'real_device' ? '🔴 REAL' : '🟡 SIMULATED'
      });
    }
  }, [capturedFingers, currentFingerIndex, progress, isCapturing, captureProgress, isComplete, captureSource]);

  // ✅ Handle start capture
  const handleStartCapture = () => {
    setLocalError('');
    clearError();
    console.log(`🔍 Starting capture for: ${currentFinger}`);
    console.log(`📊 Current scanner mode: ${scannerDisplay.mode}`);
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
    setCaptureSource('unknown');
  };

  const allFingersCaptured = Object.keys(capturedFingers).length === FINGER_ORDER.length;

  // ✅ Get visual mode indicator
  const getModeVisual = () => {
    if (scannerDisplay.mode === 'real') {
      return {
        border: 'border-green-500',
        bg: 'bg-green-50',
        text: 'text-green-700',
        badge: 'bg-green-500',
        label: 'REAL SCANNER'
      };
    }
    if (scannerDisplay.mode === 'simulated') {
      return {
        border: 'border-yellow-500',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        badge: 'bg-yellow-500',
        label: 'SIMULATED'
      };
    }
    return {
      border: 'border-red-500',
      bg: 'bg-red-50',
      text: 'text-red-700',
      badge: 'bg-red-500',
      label: 'OFFLINE'
    };
  };

  const modeVisual = getModeVisual();

  // ✅ Render
  return (
    <div className={`space-y-6 ${className}`}>
      {/* ✅ Scanner Mode Popup - Shows on mount */}
      {showModePopup && !popupClosed && (
        <ScannerModePopup
          onClose={() => {
            console.log('🔄 Popup closed by user in FiveFingerCapture');
            setShowModePopup(false);
            setPopupClosed(true);
          }}
          autoClose={true}
          duration={8000}
        />
      )}

      {/* ✅ Scanner Mode Indicator at top */}
      <ScannerModeIndicator showDetails={true} />

      {/* Scanner Status Display with Mode Badge */}
      <div className={`p-3 rounded-lg border-2 ${scannerDisplay.bg} border-gray-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{scannerDisplay.text.split(' ')[0]}</span>
            <span className={`font-medium ${scannerDisplay.color}`}>
              {scannerDisplay.text}
            </span>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${modeVisual.badge}`}>
            {modeVisual.label}
          </div>
        </div>
        {scannerStatus.deviceInfo && scannerDisplay.mode === 'real' && (
          <p className="text-xs text-green-600 mt-1">
            📱 {scannerStatus.deviceInfo.Manufacturer} {scannerStatus.deviceInfo.Model}
            {scannerStatus.deviceInfo.SerialNumber && ` · SN: ${scannerStatus.deviceInfo.SerialNumber}`}
          </p>
        )}
        {scannerDisplay.mode === 'simulated' && (
          <p className="text-xs text-yellow-600 mt-1">
            💡 No physical scanner detected. Using simulated mode for development.
          </p>
        )}
        {scannerDisplay.mode === 'real' && (
          <p className="text-xs text-green-600 mt-1">
            ✅ Fingerprint scanner is ready. Place your finger on the device.
          </p>
        )}
      </div>

      {/* Fingerprint Visualizer with Mode Badge */}
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
          mode={scannerDisplay.mode === 'real' ? 'real' : 'simulated'}
          sourceLabel={currentFingerData?.sourceLabel || (scannerDisplay.mode === 'real' ? '🔴 REAL' : '🟡 SIMULATED')}
        />

        {/* Status Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isConnected ? 'text-white/80' : 'text-red-400'}`}>
              {!isConnected ? '🔴 Scanner Disconnected' : 
               scannerDisplay.mode === 'real' ? '🟢 Real Scanner Online' : 
               scannerDisplay.mode === 'simulated' ? '🟡 Simulated Mode' : 
               '🔴 Scanner Offline'}
            </span>
            {isCapturing && (
              <span className="text-xs text-blue-300 animate-pulse">
                {scannerDisplay.mode === 'real' ? '🔴' : '🟡'} Scanning... {Math.round(captureProgress)}%
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
                <div className={`p-3 rounded-lg border ${
                  currentFingerData.source === 'real_device' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {currentFingerData.source === 'real_device' ? '🟢' : '🟡'}
                    </span>
                    <div>
                      <p className={`font-medium ${
                        currentFingerData.source === 'real_device' 
                          ? 'text-green-800' 
                          : 'text-yellow-800'
                      }`}>
                        {currentFingerData.source === 'real_device' ? '✅ REAL CAPTURE!' : '⚠️ SIMULATED CAPTURE'}
                      </p>
                      <p className={`text-sm ${
                        currentFingerData.source === 'real_device' 
                          ? 'text-green-700' 
                          : 'text-yellow-700'
                      }`}>
                        Quality: {Math.round(currentFingerData.quality)}%
                        {currentFingerData.source === 'real_device' && ' · From physical device'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
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
                  variant={scannerDisplay.mode === 'real' ? 'primary' : 'warning'}
                >
                  {isCapturing
                    ? `${scannerDisplay.mode === 'real' ? '🔴' : '🟡'} Scanning ${FINGER_NAMES[currentFinger]}...`
                    : !isConnected
                    ? '🔴 Scanner Not Connected'
                    : scannerDisplay.mode === 'real'
                    ? `🟢 Capture ${FINGER_NAMES[currentFinger]} (Real)`
                    : `🟡 Capture ${FINGER_NAMES[currentFinger]} (Simulated)`}
                </Button>

                {isCapturing && (
                  <Button variant="secondary" onClick={handleStopCapture} className="w-full">
                    ⏹ Stop Capture
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
                <p className="text-sm text-green-700">
                  Quality scores are good. Ready to save.
                  {Object.values(capturedFingers).some(f => f.source === 'real_device') && 
                    ' ✅ Real device data included.'}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Total data size: {Object.values(capturedFingers).reduce((sum, f) => sum + f.data.length, 0)} characters
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Source: {Object.values(capturedFingers).every(f => f.source === 'real_device') 
                    ? '🔴 All from REAL device' 
                    : Object.values(capturedFingers).some(f => f.source === 'real_device')
                    ? '🔴 Mixed (Real + Simulated)'
                    : '🟡 All SIMULATED'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Finger status grid with source indicators */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {FINGER_ORDER.map((finger, index) => {
          const isCaptured = !!capturedFingers[finger];
          const isCurrent = index === currentFingerIndex;
          const fingerData = capturedFingers[finger];
          const isReal = fingerData?.source === 'real_device';

          return (
            <div
              key={finger}
              className={`
                p-2 rounded-lg text-center transition-all border-2
                ${isCaptured ? (
                  isReal 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-yellow-50 border-yellow-400'
                ) : 'bg-gray-50 border-gray-300'}
                ${isCurrent && !isCaptured ? 'border-2 border-biomed-green animate-pulse' : ''}
                ${isCaptured ? 'opacity-100' : 'opacity-70'}
                ${disabled ? 'opacity-50' : ''}
              `}
            >
              <div className="text-sm font-medium text-gray-700 truncate">
                {FINGER_NAMES[finger].split(' ').pop()}
              </div>
              <div className="mt-1">
                {isCaptured ? (
                  isReal ? (
                    <span className="text-green-600" title="Real device capture">🟢</span>
                  ) : (
                    <span className="text-yellow-600" title="Simulated capture">🟡</span>
                  )
                ) : isCurrent ? (
                  <span className="text-blue-600">🔄</span>
                ) : (
                  <span className="text-gray-400">⏳</span>
                )}
              </div>
              {isCaptured && fingerData && (
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(fingerData.quality)}%
                  {isReal && <span className="text-green-600 ml-1">●</span>}
                </div>
              )}
              {isCaptured && (
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {isReal ? 'REAL' : 'SIM'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FiveFingerCapture;