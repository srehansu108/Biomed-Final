// client/src/components/fingerprint/FingerprintScanner.jsx

import React from 'react';

export const FingerprintScanner = ({ 
  status, 
  isCapturing, 
  onScan, 
  message,
  attempts,
  maxAttempts,
  selectedFinger,
  scannerMode = 'simulated' // ✅ NEW: 'real' or 'simulated'
}) => {
  // Get status styles
  const getStatusStyles = () => {
    switch (status) {
      case 'scanning':
        return {
          borderColor: 'border-blue-500',
          bgColor: 'bg-blue-50',
          pulse: true,
          icon: '🔍',
        };
      case 'success':
        return {
          borderColor: 'border-green-500',
          bgColor: 'bg-green-50',
          pulse: false,
          icon: '✅',
        };
      case 'error':
        return {
          borderColor: 'border-red-500',
          bgColor: 'bg-red-50',
          pulse: false,
          icon: '❌',
        };
      default:
        return {
          borderColor: selectedFinger ? 'border-blue-300' : 'border-gray-300',
          bgColor: selectedFinger ? 'bg-blue-50/50' : 'bg-gray-50',
          pulse: false,
          icon: selectedFinger?.icon || '🖐️',
        };
    }
  };

  const styles = getStatusStyles();

  // ✅ Get scanner mode indicator
  const getModeIndicator = () => {
    if (scannerMode === 'real') {
      return {
        icon: '🟢',
        label: 'REAL SCANNER',
        color: 'text-green-600',
        bg: 'bg-green-100 border-green-400'
      };
    }
    return {
      icon: '🟡',
      label: 'SIMULATED MODE',
      color: 'text-yellow-600',
      bg: 'bg-yellow-100 border-yellow-400'
    };
  };

  const mode = getModeIndicator();

  // Get status message based on state
  const getStatusMessage = () => {
    if (status === 'scanning') return message || 'Scanning fingerprint...';
    if (status === 'success') return message || '✅ Fingerprint captured!';
    if (status === 'error') return message || '❌ Capture failed. Please try again.';
    if (!selectedFinger) return 'Select a finger to begin';
    return message || `Ready to scan ${selectedFinger.label}`;
  };

  return (
    <div className="flex flex-col items-center">
      {/* ✅ Mode Indicator Banner */}
      <div className={`w-full mb-4 p-2 rounded-lg border-2 text-center ${mode.bg}`}>
        <span className={`text-sm font-bold ${mode.color}`}>
          {mode.icon} {mode.label}
          {scannerMode === 'simulated' && (
            <span className="text-xs font-normal ml-2 text-gray-600">
              (No physical scanner detected)
            </span>
          )}
          {scannerMode === 'real' && (
            <span className="text-xs font-normal ml-2 text-green-600">
              (Physical device connected)
            </span>
          )}
        </span>
      </div>

      {/* Scanner Visual */}
      <div 
        className={`
          relative w-48 h-48 rounded-full 
          ${styles.bgColor} 
          border-4 ${styles.borderColor}
          flex items-center justify-center
          transition-all duration-300
          ${styles.pulse ? 'animate-pulse' : ''}
          ${selectedFinger && status === 'idle' ? 'cursor-pointer hover:scale-105 transition-transform' : 'cursor-default'}
          ${isCapturing && scannerMode === 'simulated' ? 'border-yellow-400' : ''}
          ${isCapturing && scannerMode === 'real' ? 'border-green-400' : ''}
        `}
        onClick={() => {
          if (selectedFinger && status === 'idle' && !isCapturing) {
            onScan();
          }
        }}
        role="button"
        tabIndex={selectedFinger ? 0 : -1}
        onKeyPress={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && selectedFinger && status === 'idle') {
            onScan();
          }
        }}
      >
        <div className="text-6xl">
          {isCapturing ? (
            <svg className="w-16 h-16 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            styles.icon
          )}
        </div>

        {/* Attempt indicator */}
        {attempts > 0 && attempts < maxAttempts && status !== 'success' && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
            {attempts}
          </div>
        )}

        {/* Selected finger label */}
        {selectedFinger && status === 'idle' && !isCapturing && (
          <div className="absolute -bottom-6 text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full shadow-sm border border-gray-200">
            Tap to scan
          </div>
        )}
      </div>

      {/* Status Message */}
      <div className="mt-6 text-center">
        <p className={`text-sm font-medium ${
          status === 'error' ? 'text-red-600' :
          status === 'success' ? 'text-green-600' :
          status === 'scanning' ? 'text-blue-600' :
          selectedFinger ? 'text-gray-700' : 'text-gray-400'
        }`}>
          {getStatusMessage()}
        </p>
        
        {/* Progress bar for scanning */}
        {status === 'scanning' && (
          <div className="w-full max-w-xs mx-auto mt-3">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                style={{ width: '60%' }}
              >
                <div className="h-full w-full bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">Please hold your finger still...</p>
          </div>
        )}

        {/* Attempts remaining */}
        {attempts > 0 && attempts < maxAttempts && status !== 'success' && status !== 'scanning' && (
          <p className="text-xs text-gray-500 mt-1">
            Attempt {attempts} of {maxAttempts}
          </p>
        )}

        {/* Max attempts reached */}
        {attempts >= maxAttempts && status === 'error' && (
          <p className="text-xs text-red-500 mt-1">
            Maximum attempts reached. Try a different finger.
          </p>
        )}
      </div>

      {/* Click hint - only show when finger is selected */}
      {selectedFinger && status === 'idle' && !isCapturing && (
        <p className="text-xs text-gray-400 mt-2">
          Click scanner icon or press Space/Enter
        </p>
      )}

      {/* No finger selected hint */}
      {!selectedFinger && status === 'idle' && (
        <p className="text-xs text-gray-400 mt-2">
          Select a finger above to start
        </p>
      )}
    </div>
  );
};