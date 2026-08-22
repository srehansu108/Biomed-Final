import React, { useState, useEffect } from 'react';
import { useFingerprint } from '../../hooks/useFingerprint';
import { Spinner } from '../common/Spinner';
import { Alert } from '../common/Alert';

export const FingerprintScanner = ({
  onCapture,
  onError,
  fingerType = 'right_thumb',
  buttonText = 'Scan Fingerprint',
  className = '',
}) => {
  const { captureFingerprint, isCapturing, error, status } = useFingerprint();
  const [scanStatus, setScanStatus] = useState('idle');

  const handleScan = async () => {
    setScanStatus('scanning');
    try {
      const result = await captureFingerprint(fingerType);
      if (result.success) {
        setScanStatus('success');
        onCapture?.(result);
      } else {
        setScanStatus('error');
        onError?.(result.error);
      }
    } catch (err) {
      setScanStatus('error');
      onError?.(err.message);
    }
  };

  const getStatusMessage = () => {
    switch (scanStatus) {
      case 'scanning':
        return 'Scanning fingerprint... Please hold your finger on the scanner';
      case 'success':
        return '✅ Fingerprint captured successfully!';
      case 'error':
        return '❌ Failed to capture fingerprint. Please try again.';
      default:
        return 'Place your finger on the scanner when ready';
    }
  };

  const getStatusColor = () => {
    switch (scanStatus) {
      case 'scanning':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`p-6 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
      {/* Scanner Icon */}
      <div className="flex justify-center mb-4">
        <div className={`
          w-24 h-24 rounded-full flex items-center justify-center
          ${scanStatus === 'scanning' ? 'bg-blue-100 animate-pulse' : 
            scanStatus === 'success' ? 'bg-green-100' : 
            scanStatus === 'error' ? 'bg-red-100' : 'bg-gray-200'}
        `}>
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.81 4.47c-.08 0-.16-.02-.23-.06l-4.44-2.56c-.21-.12-.47-.12-.68 0l-4.44 2.56c-.14.08-.23.23-.23.39v5.12c0 .16.09.31.23.39l4.44 2.56c.21.12.47.12.68 0l4.44-2.56c.14-.08.23-.23.23-.39V4.86c0-.16-.09-.31-.23-.39z M8.56 9.86l4.44 2.56c.21.12.47.12.68 0l4.44-2.56c.14-.08.23-.23.23-.39v-1.5l-4.44 2.56c-.21.12-.47.12-.68 0L8.33 7.97v1.5c0 .16.09.31.23.39z"/>
          </svg>
        </div>
      </div>

      {/* Status Message */}
      <p className={`text-center text-sm font-medium ${getStatusColor()} mb-4`}>
        {getStatusMessage()}
      </p>

      {/* Progress indicator */}
      {scanStatus === 'scanning' && (
        <div className="flex justify-center mb-4">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quality indicator */}
      {scanStatus === 'success' && status?.quality && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-700">Quality Score</span>
            <span className="text-sm font-bold text-green-700">{status.quality}%</span>
          </div>
          <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                status.quality >= 85 ? 'bg-green-500' :
                status.quality >= 70 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${status.quality}%` }}
            />
          </div>
        </div>
      )}

      {/* Error display */}
      {error && scanStatus === 'error' && (
        <Alert type="error" message={error} className="mb-4" />
      )}

      {/* Action Button */}
      <button
        onClick={handleScan}
        disabled={scanStatus === 'scanning' || isCapturing}
        className="btn-primary w-full"
      >
        {scanStatus === 'scanning' ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" color="white" />
            Scanning...
          </span>
        ) : scanStatus === 'success' ? (
          '✅ Captured - Scan Again'
        ) : (
          buttonText
        )}
      </button>

      {/* Tips */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>💡 Tips: Clean finger, apply normal pressure, stay still</p>
      </div>
    </div>
  );
};