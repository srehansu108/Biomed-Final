// Frontend/src/components/fingerprint/ScannerModeIndicator.jsx

import React, { useEffect, useState } from 'react';
import { useFingerprintWebSocket } from '../../hooks/useFingerprintWebSocket';

export const ScannerModeIndicator = ({ showDetails = true, className = '' }) => {
  const { scannerStatus, isConnected } = useFingerprintWebSocket();
  const [isRealScanner, setIsRealScanner] = useState(false);
  const [isSimulated, setIsSimulated] = useState(true);
  const [deviceModel, setDeviceModel] = useState('');
  const [captureSource, setCaptureSource] = useState('unknown');

  useEffect(() => {
    if (scannerStatus) {
      const real = !scannerStatus.isSimulated && scannerStatus.deviceConnected;
      const sim = scannerStatus.isSimulated || !scannerStatus.deviceConnected;
      
      setIsRealScanner(real);
      setIsSimulated(sim);
      setCaptureSource(real ? 'real_device' : 'simulated');
      
      if (scannerStatus.deviceInfo?.Model) {
        setDeviceModel(scannerStatus.deviceInfo.Model);
      }
      
      console.log('🔍 Scanner Status Update:', {
        isRealScanner: real,
        isSimulated: sim,
        captureSource: real ? 'real_device' : 'simulated',
        deviceInfo: scannerStatus.deviceInfo
      });
    }
  }, [scannerStatus]);

  const getModeDetails = () => {
    if (!isConnected) {
      return {
        icon: '🔴',
        label: 'Scanner Disconnected',
        color: 'text-red-600',
        bg: 'bg-red-50 border-red-300',
        badge: 'bg-red-500',
        description: 'No scanner detected. Please check connection.'
      };
    }

    if (isRealScanner) {
      return {
        icon: '🟢',
        label: `Real Scanner (${deviceModel || 'Futronic'})`,
        color: 'text-green-600',
        bg: 'bg-green-50 border-green-300',
        badge: 'bg-green-500 animate-pulse',
        description: '✅ Physical scanner is connected and ready for real fingerprint capture.'
      };
    }

    if (isSimulated) {
      return {
        icon: '🟡',
        label: 'Simulated Mode',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50 border-yellow-300',
        badge: 'bg-yellow-500',
        description: '⚠️ No physical scanner detected. Using simulated fingerprints (for testing only).'
      };
    }

    return {
      icon: '🔵',
      label: 'Unknown Mode',
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-300',
      badge: 'bg-blue-500',
      description: 'Scanner status unknown.'
    };
  };

  const details = getModeDetails();

  return (
    <div className={`p-4 rounded-lg border-2 ${details.bg} ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${details.badge}`} />
        <span className={`text-lg font-bold ${details.color}`}>
          {details.icon} {details.label}
        </span>
        <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${
          captureSource === 'real_device' 
            ? 'bg-green-500 text-white' 
            : 'bg-yellow-500 text-white'
        }`}>
          {captureSource === 'real_device' ? '🔴 REAL CAPTURE' : '🟡 SIMULATED'}
        </span>
      </div>

      {showDetails && (
        <>
          <p className={`text-sm mt-2 ${details.color} opacity-80`}>
            {details.description}
          </p>
          
          {/* Source confirmation */}
          <div className="mt-3 p-3 bg-white/50 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-600">Capture Source:</div>
              <div className={`font-bold ${captureSource === 'real_device' ? 'text-green-600' : 'text-yellow-600'}`}>
                {captureSource === 'real_device' ? '✅ REAL DEVICE' : '⚠️ SIMULATED'}
              </div>
              
              <div className="text-gray-600">Device Status:</div>
              <div className={`font-bold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? '✅ Connected' : '❌ Disconnected'}
              </div>
              
              {isRealScanner && deviceModel && (
                <>
                  <div className="text-gray-600">Device Model:</div>
                  <div className="font-bold text-gray-800">{deviceModel}</div>
                </>
              )}
              
              {scannerStatus?.sdkVersion && (
                <>
                  <div className="text-gray-600">SDK Version:</div>
                  <div className="font-bold text-gray-800">{scannerStatus.sdkVersion}</div>
                </>
              )}
            </div>
          </div>

          {captureSource === 'real_device' && (
            <div className="mt-3 p-3 bg-green-100 border-2 border-green-400 rounded-lg">
              <p className="text-sm text-green-800 font-bold flex items-center gap-2">
                <span>✅</span>
                CONFIRMED: Capturing from physical Futronic device!
              </p>
              <p className="text-xs text-green-700 mt-1">
                Fingerprints will be real and usable for login. Quality scores reflect actual fingerprint quality.
              </p>
            </div>
          )}

          {captureSource === 'simulated' && (
            <div className="mt-3 p-3 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
              <p className="text-sm text-yellow-800 font-bold flex items-center gap-2">
                <span>⚠️</span>
                SIMULATED MODE: Not using real device!
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                These fingerprints are artificially generated and will NOT work for login with a real device.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ScannerModeIndicator;