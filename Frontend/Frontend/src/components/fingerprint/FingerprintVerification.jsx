import React, { useState } from 'react';
import { useFingerprint } from '../../hooks/useFingerprint';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { QualityIndicator } from './QualityIndicator';

export const FingerprintVerification = ({
  onVerify,
  onSuccess,
  onFailure,
  userId,
  className = '',
}) => {
  const { verifyFingerprint, isVerifying, error } = useFingerprint();
  const [status, setStatus] = useState('idle'); // idle, scanning, verifying, success, failure
  const [matchScore, setMatchScore] = useState(0);
  const [verificationError, setVerificationError] = useState('');

  const handleVerify = async () => {
    setStatus('scanning');
    setVerificationError('');
    
    try {
      const result = await verifyFingerprint(userId);
      
      if (result.success) {
        setMatchScore(result.matchScore);
        setStatus(result.isMatch ? 'success' : 'failure');
        
        if (result.isMatch) {
          onSuccess?.(result);
        } else {
          onFailure?.(result);
        }
        onVerify?.(result);
      } else {
        setStatus('failure');
        setVerificationError(result.error || 'Verification failed');
        onFailure?.(result);
      }
    } catch (err) {
      setStatus('failure');
      setVerificationError(err.message || 'An error occurred during verification');
      onFailure?.({ error: err.message });
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'scanning':
        return {
          icon: '🔄',
          title: 'Scanning Fingerprint...',
          description: 'Please hold your finger on the scanner',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      case 'verifying':
        return {
          icon: '⏳',
          title: 'Verifying Fingerprint...',
          description: 'Please wait while we verify your identity',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
        };
      case 'success':
        return {
          icon: '✅',
          title: 'Verification Successful!',
          description: `Match Score: ${Math.round(matchScore)}%`,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'failure':
        return {
          icon: '❌',
          title: 'Verification Failed',
          description: verificationError || 'Fingerprint did not match',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        };
      default:
        return {
          icon: '🔐',
          title: 'Ready to Verify',
          description: 'Place your finger on the scanner to verify',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className={`p-6 bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Status Display */}
      <div className={`p-4 rounded-lg mb-4 ${statusDisplay.bgColor}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{statusDisplay.icon}</span>
          <div>
            <h4 className={`font-semibold ${statusDisplay.color}`}>
              {statusDisplay.title}
            </h4>
            <p className="text-sm text-gray-600">{statusDisplay.description}</p>
          </div>
        </div>
      </div>

      {/* Match Score (if verified) */}
      {status === 'success' && (
        <div className="mb-4">
          <QualityIndicator quality={matchScore} showLabel />
        </div>
      )}

      {/* Error Display */}
      {error && status === 'failure' && (
        <Alert type="error" message={error} className="mb-4" />
      )}

      {/* Verification Button */}
      <Button
        onClick={handleVerify}
        isLoading={status === 'scanning' || isVerifying}
        disabled={status === 'scanning' || isVerifying}
        className="w-full"
      >
        {status === 'scanning' || isVerifying ? 'Verifying...' : 'Verify Fingerprint'}
      </Button>

      {/* Tips */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>💡 Tips: Clean finger, apply normal pressure, stay still</p>
      </div>
    </div>
  );
};