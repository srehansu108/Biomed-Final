// client/src/components/fingerprint/FiveFingerCapture.jsx (SIMPLIFIED - NO AUTH)
import React, { useState, useEffect, useRef } from 'react';
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
  // ✅ Removed isAuthenticated from here
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
  const [captureStatus, setCaptureStatus] = useState('idle');
  const timeoutRef = useRef(null);

  const currentFinger = FINGER_ORDER[currentFingerIndex];
  const progress = (Object.keys(capturedFingers).length / FINGER_ORDER.length) * 100;

  // Handle WebSocket messages
  useEffect(() => {
    if (captureStatus !== 'capturing') return;

    if (fingerprintData && fingerprintData.fingerType === currentFinger) {
      const quality = fingerprintData.quality || 0;
      
      if (quality < 50) {
        setLocalError(`Poor quality (${quality}%). Please try again.`);
        setCaptureStatus('error');
        return;
      }

      const updatedFingers = {
        ...capturedFingers,
        [currentFinger]: fingerprintData
      };
      setCapturedFingers(updatedFingers);
      setCurrentFingerData(fingerprintData);
      setCaptureStatus('complete');

      if (onProgress) {
        onProgress({
          currentFinger,
          capturedCount: Object.keys(updatedFingers).length,
          total: FINGER_ORDER.length,
          progress: (Object.keys(updatedFingers).length / FINGER_ORDER.length) * 100,
          capturedFingers: updatedFingers,
          isCapturing: false,
          captureProgress: 100
        });
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (currentFingerIndex < FINGER_ORDER.length - 1) {
          setCurrentFingerIndex(prev => prev + 1);
          setCurrentFingerData(null);
          setCaptureStatus('idle');
          setLocalError('');
        } else {
          setIsComplete(true);
          setCaptureStatus('idle');
          if (onComplete) {
            onComplete(updatedFingers);
          }
        }
      }, 1500);
    }

    if (wsError) {
      setLocalError(wsError);
      setCaptureStatus('error');
    }
  }, [fingerprintData, wsError, currentFinger, currentFingerIndex, capturedFingers, captureStatus, onComplete, onProgress]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ✅ NO AUTH CHECK - Just check if connected
  const handleStartCapture = () => {
    if (!isConnected) {
      setLocalError('Scanner not connected. Please check connection.');
      return;
    }

    setLocalError('');
    setCaptureStatus('capturing');
    startCapture(currentFinger);
  };

  const handleStopCapture = () => {
    stopCapture();
    setCaptureStatus('idle');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleRetryFinger = () => {
    setCurrentFingerData(null);
    setCaptureStatus('idle');
    setLocalError('');
    const updatedFingers = { ...capturedFingers };
    delete updatedFingers[currentFinger];
    setCapturedFingers(updatedFingers);
  };

  const handleReset = () => {
    setCurrentFingerIndex(0);
    setCapturedFingers({});
    setCurrentFingerData(null);
    setIsComplete(false);
    setCaptureStatus('idle');
    setLocalError('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const allFingersCaptured = Object.keys(capturedFingers).length === FINGER_ORDER.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status Bar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium text-gray-700">
            {isConnected ? '✅ Scanner Ready' : '🔴 Scanner Not Connected'}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {Object.keys(capturedFingers).length}/{FINGER_ORDER.length}
        </span>
      </div>

      {/* Fingerprint Visualizer */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        <FingerprintVisualizer
          imageData={currentFingerData?.imageData || liveData?.imageData || null}
          minutiae={currentFingerData?.minutiae || liveData?.minutiae || []}
          quality={currentFingerData?.quality || liveData?.quality || 0}
          isCapturing={captureStatus === 'capturing'}
          progress={captureProgress}
          width={400}
          height={400}
          showMinutiae={true}
          showHeatmap={true}
        />
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">
              {isConnected ? '🟢 Online' : '🔴 Offline'}
            </span>
            {captureStatus === 'capturing' && (
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
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Finger */}
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          {isComplete || allFingersCaptured 
            ? '✅ All Fingers Captured!' 
            : `Step ${currentFingerIndex + 1}: ${FINGER_NAMES[currentFinger]}`
          }
        </h4>

        {!isComplete && !allFingersCaptured && (
          <>
            {currentFingerData || captureStatus === 'complete' ? (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-medium text-green-800">Captured!</p>
                      <p className="text-sm text-green-700">
                        Quality: {Math.round(currentFingerData?.quality || 0)}%
                      </p>
                    </div>
                  </div>
                </div>
                {currentFingerData?.quality && (
                  <QualityIndicator quality={currentFingerData.quality} />
                )}
                <Button variant="outline" onClick={handleRetryFinger} className="w-full">
                  🔄 Retry This Finger
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={handleStartCapture}
                  isLoading={captureStatus === 'capturing'}
                  disabled={captureStatus === 'capturing' || !isConnected}
                  className="w-full"
                  size="lg"
                >
                  {captureStatus === 'capturing' 
                    ? `Scanning ${FINGER_NAMES[currentFinger]}...` 
                    : !isConnected 
                    ? '🔴 Scanner Not Connected'
                    : `Capture ${FINGER_NAMES[currentFinger]}`
                  }
                </Button>
                
                {captureStatus === 'capturing' && (
                  <Button variant="secondary" onClick={handleStopCapture} className="w-full">
                    ⏹ Stop Capture
                  </Button>
                )}
              </div>
            )}

            {localError && (
              <Alert type="error" message={localError} className="mt-3" onClose={() => setLocalError('')} />
            )}
          </>
        )}

        {isComplete && allFingersCaptured && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <h5 className="font-semibold text-green-800">All Fingers Captured!</h5>
                <p className="text-sm text-green-700">Ready to save.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Finger Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {FINGER_ORDER.map((finger, index) => {
          const isCaptured = !!capturedFingers[finger];
          const isCurrent = index === currentFingerIndex;
          const isProcessing = isCurrent && captureStatus === 'capturing';

          return (
            <div
              key={finger}
              className={`
                p-3 rounded-lg text-center transition-all
                ${isCaptured ? 'bg-green-50 border-2 border-green-500' : ''}
                ${isProcessing ? 'bg-blue-50 border-2 border-blue-500 animate-pulse' : ''}
                ${!isCaptured && !isProcessing ? 'bg-gray-50 border border-gray-300' : ''}
              `}
            >
              <div className="text-sm font-medium text-gray-700 truncate">
                {FINGER_NAMES[finger].split(' ').pop()}
              </div>
              <div className="mt-2 text-2xl">
                {isCaptured ? '✅' : isProcessing ? '🔄' : '🖐️'}
              </div>
              {isCaptured && capturedFingers[finger] && (
                <div className="text-xs text-green-600 mt-1 font-medium">
                  {Math.round(capturedFingers[finger].quality)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reset Button */}
      {(isComplete || allFingersCaptured || localError) && (
        <Button variant="outline" onClick={handleReset} className="w-full">
          🔄 Start Over
        </Button>
      )}
    </div>
  );
};

export default FiveFingerCapture;