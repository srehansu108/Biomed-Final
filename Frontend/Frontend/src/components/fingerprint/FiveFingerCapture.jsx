// client/src/components/fingerprint/FiveFingerCapture.jsx (UPDATED)
import React, { useState, useEffect } from 'react';
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

export const FiveFingerCapture = ({ onComplete, onProgress, className = '' }) => {
  // 🔥 Use WebSocket for real-time capture
  const {
    isConnected,
    isCapturing,
    captureProgress,
    fingerprintData,
    liveData,
    error: wsError,
    startCapture,
    stopCapture
  } = useFingerprintWebSocket();

  const [currentFingerIndex, setCurrentFingerIndex] = useState(0);
  const [capturedFingers, setCapturedFingers] = useState({});
  const [localError, setLocalError] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [currentFingerData, setCurrentFingerData] = useState(null);

  const currentFinger = FINGER_ORDER[currentFingerIndex];
  const progress = (currentFingerIndex / FINGER_ORDER.length) * 100;

  // 🔥 Handle WebSocket messages for this component
  useEffect(() => {
    if (fingerprintData && fingerprintData.fingerType === currentFinger) {
      // Capture complete for current finger
      const updatedFingers = {
        ...capturedFingers,
        [currentFinger]: fingerprintData
      };
      setCapturedFingers(updatedFingers);
      setCurrentFingerData(fingerprintData);

      // Move to next finger
      if (currentFingerIndex < FINGER_ORDER.length - 1) {
        setTimeout(() => {
          setCurrentFingerIndex(prev => prev + 1);
          setCurrentFingerData(null);
        }, 1500);
      } else {
        setIsComplete(true);
        setTimeout(() => {
          onComplete?.(updatedFingers);
        }, 500);
      }
    }

    if (wsError) {
      setLocalError(wsError);
    }
  }, [fingerprintData, wsError]);

  // 🔥 Send progress updates to parent
  useEffect(() => {
    if (onProgress) {
      onProgress({
        currentFinger,
        capturedCount: Object.keys(capturedFingers).length,
        total: FINGER_ORDER.length,
        progress: progress,
        capturedFingers: capturedFingers,
        isCapturing,
        captureProgress
      });
    }
  }, [capturedFingers, currentFingerIndex, progress, isCapturing, captureProgress]);

  const handleStartCapture = () => {
    setLocalError('');
    startCapture(currentFinger);
  };

  const handleStopCapture = () => {
    stopCapture();
  };

  const allFingersCaptured = Object.keys(capturedFingers).length === FINGER_ORDER.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 🔥 LIVE FINGERPRINT VISUALIZER */}
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
          onFingerDetected={() => console.log('Finger detected!')}
        />
        
        {/* Scanner status overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">
              {isConnected ? '🟢 Scanner Online' : '🔴 Scanner Offline'}
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
            {isComplete ? '✅ All Fingers Captured!' : `Step ${currentFingerIndex + 1}: ${FINGER_NAMES[currentFinger]}`}
          </h4>
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
                    </div>
                  </div>
                </div>
                <QualityIndicator quality={currentFingerData.quality} />
                <Button variant="outline" onClick={() => {
                  setCurrentFingerData(null);
                  setCapturedFingers(prev => {
                    const updated = { ...prev };
                    delete updated[currentFinger];
                    return updated;
                  });
                }}>
                  Rescan
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={handleStartCapture}
                  isLoading={isCapturing}
                  disabled={isCapturing || !isConnected}
                  className="w-full"
                  size="lg"
                >
                  {isCapturing 
                    ? `Scanning ${FINGER_NAMES[currentFinger]}...` 
                    : !isConnected 
                    ? '🔴 Scanner Not Connected'
                    : `Capture ${FINGER_NAMES[currentFinger]}`
                  }
                </Button>
                
                {isCapturing && (
                  <Button
                    variant="secondary"
                    onClick={handleStopCapture}
                    className="w-full"
                  >
                    Stop Capture
                  </Button>
                )}
              </div>
            )}

            {localError && (
              <Alert type="error" message={localError} className="mt-3" />
            )}
          </>
        )}

        {isComplete && allFingersCaptured && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <h5 className="font-semibold text-green-800">All Fingers Captured!</h5>
                <p className="text-sm text-green-700">Quality scores are good. Ready to save.</p>
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