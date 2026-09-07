// client/src/components/fingerprint/ScannerModePopup.jsx

import React, { useEffect, useState } from 'react';
import { useFingerprintWebSocket } from '../../hooks/useFingerprintWebSocket';

export const ScannerModePopup = ({ 
  onClose, 
  autoClose = true,
  duration = 8000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const { scannerStatus, isConnected } = useFingerprintWebSocket();
  
  const isRealScanner = !scannerStatus.isSimulated && scannerStatus.deviceConnected;
  const isReady = scannerStatus.isReady;

  // Auto-close after duration
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  if (!isVisible) return null;

  // Determine mode details
  const mode = {
    isReal: isRealScanner && isConnected && isReady,
    icon: isRealScanner && isConnected && isReady ? '🟢' : '🟡',
    title: isRealScanner && isConnected && isReady 
      ? '✅ Real Scanner Connected' 
      : '⚠️ Simulated Mode Active',
    description: isRealScanner && isConnected && isReady
      ? 'Physical fingerprint scanner is connected and ready.'
      : 'No physical scanner detected. Using simulated fingerprints for testing.',
    bgColor: isRealScanner && isConnected && isReady 
      ? 'bg-green-50 border-green-500' 
      : 'bg-yellow-50 border-yellow-500',
    titleColor: isRealScanner && isConnected && isReady 
      ? 'text-green-800' 
      : 'text-yellow-800',
    descColor: isRealScanner && isConnected && isReady 
      ? 'text-green-600' 
      : 'text-yellow-600',
    buttonBg: isRealScanner && isConnected && isReady 
      ? 'bg-green-500 hover:bg-green-600' 
      : 'bg-yellow-500 hover:bg-yellow-600',
  };

  // Device info
  const deviceInfo = scannerStatus.deviceInfo;
  const deviceModel = deviceInfo?.Model || 'Unknown';
  const deviceManufacturer = deviceInfo?.Manufacturer || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className={`max-w-md w-full mx-4 p-6 rounded-2xl border-2 shadow-2xl ${mode.bg} bg-white`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{mode.icon}</span>
            <div>
              <h3 className={`text-xl font-bold ${mode.titleColor}`}>
                {mode.title}
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className={`text-sm ${mode.descColor}`}>
            {mode.description}
          </p>

          {/* Status Details */}
          <div className="bg-white/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${mode.titleColor}`}>
                {isConnected ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Mode:</span>
              <span className={`font-medium ${mode.titleColor}`}>
                {isRealScanner && isConnected && isReady ? 'Real Scanner' : 'Simulated'}
              </span>
            </div>
            {isRealScanner && deviceInfo && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Device:</span>
                  <span className="font-medium text-gray-800">
                    {deviceManufacturer} {deviceModel}
                  </span>
                </div>
                {deviceInfo.SerialNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Serial:</span>
                    <span className="font-mono text-xs text-gray-600">
                      {deviceInfo.SerialNumber}
                    </span>
                  </div>
                )}
              </>
            )}
            {scannerStatus.isSimulated && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Data:</span>
                <span className="text-yellow-600 text-xs font-medium">
                  ⚠️ Fake fingerprints will be generated
                </span>
              </div>
            )}
          </div>

          {/* Warning for simulated mode */}
          {!isRealScanner && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>Important:</strong> Simulated fingerprints are randomly generated 
                and will <strong>not work for login</strong>. Connect a physical scanner 
                for real biometric authentication.
              </p>
            </div>
          )}

          {/* Device Connection Status */}
          {!isConnected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-600">
                ❌ Scanner not connected. Please check the connection.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-colors ${mode.buttonBg}`}
          >
            {isRealScanner ? '✅ Continue' : '⚠️ Continue Anyway'}
          </button>
          {!isRealScanner && (
            <button
              onClick={() => {
                window.open('https://www.futronic-tech.com/', '_blank');
              }}
              className="px-4 py-2.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              🔍 Learn More
            </button>
          )}
        </div>

        {/* Auto-close countdown */}
        {autoClose && (
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-400">
              Closing in {Math.ceil(duration / 1000)}s...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ CSS Animation
const styles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
`;