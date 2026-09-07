// client/src/pages/Register/Step2Biometrics.jsx - COMPLETE WITH SCANNER MODE INDICATOR

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FiveFingerCapture } from '../../components/fingerprint/FiveFingerCapture';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import { Alert } from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';
import { ScannerModeIndicator } from '../../components/fingerprint/ScannerModeIndicator';

const Step2Biometrics = ({ formData, onSubmit, onBack, isLoading, error: propError }) => {
  const { uploadProgress } = useAuth();
  const [fingers, setFingers] = useState({});
  const [webcamImage, setWebcamImage] = useState(null);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [capturedCount, setCapturedCount] = useState(0);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [captureStatus, setCaptureStatus] = useState('Ready to capture biometrics');
  const [fingerError, setFingerError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captureSource, setCaptureSource] = useState('unknown');
  
  const webcamRef = useRef(null);

  const fingerNames = [
    'right_thumb',
    'right_index', 
    'right_middle',
    'right_ring',
    'right_little'
  ];

  // ✅ Sync external error
  useEffect(() => {
    if (propError) {
      setSubmitError(propError);
      setCaptureStatus(`❌ ${propError}`);
      setIsSubmitting(false);
    }
  }, [propError]);

  // ✅ Update progress from AuthContext
  useEffect(() => {
    if (uploadProgress > 0 && uploadProgress < 100) {
      setCaptureStatus(`⏳ Uploading... ${uploadProgress}%`);
    } else if (uploadProgress === 100) {
      setCaptureStatus('✅ Upload complete!');
    }
  }, [uploadProgress]);

  // ✅ Handle fingerprint progress updates
  const handleFingerprintProgress = useCallback((data) => {
    console.log('📊 Fingerprint progress:', data);
    setCaptureProgress(data.progress || 0);
    setCapturedCount(data.capturedCount || 0);
    setFingers(data.capturedFingers || {});
    setCaptureStatus(data.status || 'Capturing fingerprints...');
    setCaptureSource(data.source || 'unknown');
    setSubmitError(null);
    
    if (data.capturedCount === 5) {
      setCaptureStatus('✅ All fingerprints captured!');
    }
  }, []);

  // ✅ Handle fingerprint completion
  const handleFingerprintComplete = useCallback((capturedFingers) => {
    console.log('✅ Fingerprint capture complete:', capturedFingers);
    console.log('🔍 Capture source:', Object.values(capturedFingers)[0]?.source || 'unknown');
    setFingers(capturedFingers);
    setCapturedCount(Object.keys(capturedFingers).length);
    setCaptureProgress(100);
    setCaptureStatus('✅ All fingerprints captured!');
    setFingerError(null);
    setSubmitError(null);
    
    // Check if all are from real device
    const allReal = Object.values(capturedFingers).every(f => f.source === 'real_device');
    const anyReal = Object.values(capturedFingers).some(f => f.source === 'real_device');
    if (allReal) {
      setCaptureStatus('✅ All 5 fingerprints captured from REAL device!');
    } else if (anyReal) {
      setCaptureStatus('⚠️ Mixed capture: Some fingerprints are from real device, some simulated.');
    } else {
      setCaptureStatus('🟡 All fingerprints are SIMULATED (no real device detected).');
    }
  }, []);

  // ✅ Handle fingerprint error
  const handleFingerprintError = useCallback((error) => {
    console.error('❌ Fingerprint error:', error);
    setFingerError(error.message || 'Fingerprint capture failed');
    setCaptureStatus(`❌ Error: ${error.message || 'Capture failed'}`);
  }, []);

  // ✅ Capture webcam photo
  const captureWebcam = useCallback(() => {
    if (webcamRef.current) {
      setIsImageLoading(true);
      setSubmitError(null);
      try {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          setWebcamImage(imageSrc);
          setCaptureStatus('✅ Profile photo captured!');
          setWebcamError(null);
        } else {
          throw new Error('Failed to capture photo');
        }
      } catch (error) {
        console.error('Webcam capture error:', error);
        setWebcamError('Failed to capture photo. Please try again.');
      } finally {
        setIsImageLoading(false);
      }
    }
  }, []);

  // ✅ Retake webcam photo
  const retakeWebcam = useCallback(() => {
    setWebcamImage(null);
    setWebcamError(null);
    setCaptureStatus('Ready to capture profile photo');
    setSubmitError(null);
  }, []);

  // ✅ Handle webcam ready
  const handleWebcamReady = useCallback(() => {
    setIsWebcamReady(true);
    setWebcamError(null);
    console.log('📷 Webcam ready');
  }, []);

  // ✅ Handle webcam error
  const handleWebcamError = useCallback((error) => {
    console.error('Webcam error:', error);
    setWebcamError('Camera access denied. Please allow camera access and refresh.');
    setIsWebcamReady(false);
  }, []);

  // ✅ Check if all fingers are captured
  const allFingersCaptured = Object.keys(fingers).length === 5;

  // ✅ Validate before submit
  const getSubmitValidation = useCallback(() => {
    if (!allFingersCaptured && !webcamImage) {
      return {
        valid: false,
        message: 'Please capture all 5 fingerprints AND a profile photo'
      };
    }
    if (!allFingersCaptured) {
      return {
        valid: false,
        message: `Please capture all 5 fingerprints (${capturedCount}/5 completed)`
      };
    }
    if (!webcamImage) {
      return {
        valid: false,
        message: 'Please capture your profile photo'
      };
    }
    return { valid: true, message: '' };
  }, [allFingersCaptured, capturedCount, webcamImage]);

  // ✅ Handle final submit
  const handleSubmit = useCallback(async () => {
    const validation = getSubmitValidation();
    if (!validation.valid) {
      setCaptureStatus(`❌ ${validation.message}`);
      setSubmitError(validation.message);
      return;
    }

    // ✅ Log capture source before submit
    const sourceInfo = Object.values(fingers).every(f => f.source === 'real_device') 
      ? 'All REAL device' 
      : Object.values(fingers).some(f => f.source === 'real_device')
      ? 'Mixed (Real + Simulated)'
      : 'All SIMULATED';
    
    console.log(`🔍 Submitting fingerprints: ${sourceInfo}`);

    setSubmitError(null);
    setIsSubmitting(true);
    setCaptureStatus('⏳ Preparing upload...');
    console.log('🔐 Submitting biometrics...');

    const submissionData = {
      fingerprints: fingers,
      profileImage: webcamImage,
      source: captureSource // Pass source info to backend
    };

    try {
      await onSubmit(submissionData);
      setCaptureStatus('✅ Registration completed!');
    } catch (error) {
      const errorMsg = error.message || 'Registration failed';
      setSubmitError(errorMsg);
      setCaptureStatus(`❌ ${errorMsg}`);
      setIsSubmitting(false);
      throw error;
    }
  }, [fingers, webcamImage, onSubmit, getSubmitValidation, captureSource]);

  // ✅ Reset all biometrics
  const resetAll = useCallback(() => {
    setFingers({});
    setWebcamImage(null);
    setCaptureProgress(0);
    setCapturedCount(0);
    setCaptureStatus('Ready to capture biometrics');
    setFingerError(null);
    setWebcamError(null);
    setSubmitError(null);
    setIsSubmitting(false);
    setCaptureSource('unknown');
  }, []);

  // ✅ Retry fingerprint capture
  const retryFingerprints = useCallback(() => {
    setFingers({});
    setCaptureProgress(0);
    setCapturedCount(0);
    setFingerError(null);
    setCaptureStatus('Retrying fingerprint capture...');
    setSubmitError(null);
    setCaptureSource('unknown');
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Biometric Setup</h2>
        <p className="text-gray-600 mt-2">
          Capture all five fingerprints and a profile photo
        </p>
        {captureStatus && (
          <p className={`mt-2 text-sm ${
            captureStatus.includes('✅') ? 'text-green-600' : 
            captureStatus.includes('❌') ? 'text-red-600' : 
            captureStatus.includes('⚠️') ? 'text-yellow-600' : 
            'text-gray-600'
          }`}>
            {captureStatus}
          </p>
        )}
        {/* ✅ Display submit errors */}
        {submitError && (
          <Alert type="error" message={submitError} className="mt-2" />
        )}
        {fingerError && (
          <Alert type="error" message={fingerError} className="mt-2" />
        )}
        {webcamError && (
          <Alert type="error" message={webcamError} className="mt-2" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Fingerprint Capture */}
        <div className="space-y-6">
          {/* ✅ Scanner Mode Indicator */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔍 Scanner Status
            </h3>
            <ScannerModeIndicator showDetails={true} />
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Five Finger Scanning
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({capturedCount}/5)
              </span>
            </h3>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(captureProgress)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-biomed-green transition-all duration-500"
                  style={{ width: `${captureProgress}%` }}
                />
              </div>
            </div>

            {/* Fingerprint Capture Component */}
            <FiveFingerCapture
              onComplete={handleFingerprintComplete}
              onProgress={handleFingerprintProgress}
              onError={handleFingerprintError}
              disabled={isLoading || isSubmitting}
            />

            {/* Retry button if errors */}
            {fingerError && (
              <Button 
                variant="secondary" 
                onClick={retryFingerprints}
                className="w-full mt-3"
                disabled={isSubmitting}
              >
                Retry Fingerprint Capture
              </Button>
            )}

            {/* Captured Fingers List with Source Info */}
            {capturedCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Captured Fingers:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(fingers).map(([finger, data]) => {
                    const isReal = data?.source === 'real_device';
                    return (
                      <span 
                        key={finger} 
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                          isReal 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <span>{isReal ? '🟢' : '🟡'}</span>
                        {finger.replace('_', ' ').toUpperCase()}
                        <span className="text-[10px] opacity-75">
                          ({isReal ? 'REAL' : 'SIM'})
                        </span>
                      </span>
                    );
                  })}
                  {fingerNames
                    .filter(f => !fingers[f])
                    .map((finger) => (
                      <span 
                        key={finger} 
                        className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full"
                      >
                        <span>⏳</span>
                        {finger.replace('_', ' ').toUpperCase()}
                      </span>
                    ))}
                </div>
                {/* Source summary */}
                {capturedCount === 5 && (
                  <div className="mt-2 text-xs">
                    {Object.values(fingers).every(f => f.source === 'real_device') && (
                      <span className="text-green-600 font-medium">✅ All from REAL device</span>
                    )}
                    {Object.values(fingers).some(f => f.source === 'real_device') && 
                     !Object.values(fingers).every(f => f.source === 'real_device') && (
                      <span className="text-yellow-600 font-medium">⚠️ Mixed: Real + Simulated</span>
                    )}
                    {Object.values(fingers).every(f => f.source !== 'real_device') && (
                      <span className="text-yellow-600 font-medium">🟡 All SIMULATED</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              💡 Tips for Best Results
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Place your finger flat on the scanner</li>
              <li>• Apply normal pressure (not too hard, not too soft)</li>
              <li>• Ensure good lighting</li>
              <li>• Keep fingers clean and dry</li>
              <li>• Wait for the beep before lifting your finger</li>
              <li>• {captureSource === 'real_device' ? '🔴 Using REAL scanner' : '🟡 Using SIMULATED mode'}</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Webcam Capture + Status */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Profile Photo
              {webcamImage && (
                <span className="ml-2 text-sm font-normal text-green-600">✅ Captured</span>
              )}
            </h3>
            
            {/* Webcam/Image Display */}
            <div className="relative aspect-square max-w-sm mx-auto bg-gray-100 rounded-lg overflow-hidden">
              {webcamImage ? (
                <>
                  <img
                    src={webcamImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onLoad={() => setIsImageLoading(false)}
                  />
                  {isImageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
                      <Spinner size="md" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className={`w-full h-full object-cover ${
                      !isWebcamReady ? 'opacity-50' : ''
                    }`}
                    videoConstraints={{
                      width: 400,
                      height: 400,
                      facingMode: "user"
                    }}
                    onUserMedia={handleWebcamReady}
                    onUserMediaError={handleWebcamError}
                  />
                  {!isWebcamReady && !webcamError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Spinner size="md" />
                      <p className="absolute bottom-4 text-sm text-gray-500">
                        Starting camera...
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Webcam Controls */}
            <div className="mt-4 flex gap-3">
              {webcamImage ? (
                <Button
                  variant="secondary"
                  onClick={retakeWebcam}
                  className="flex-1"
                  disabled={isLoading || isSubmitting}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retake Photo
                  </span>
                </Button>
              ) : (
                <Button
                  onClick={captureWebcam}
                  className="flex-1"
                  disabled={!isWebcamReady || isLoading || isImageLoading || isSubmitting}
                >
                  {isImageLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner size="sm" color="white" />
                      Capturing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Capture Photo
                    </span>
                  )}
                </Button>
              )}
            </div>

            {/* Photo Guide */}
            {!webcamImage && (
              <div className="mt-2 text-xs text-gray-500 text-center">
                <p>Ensure your face is clearly visible and well-lit</p>
              </div>
            )}
          </Card>

          {/* Status Summary */}
          <Card>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Enrollment Status
            </h4>
            <div className="space-y-3">
              {/* Fingerprint Status */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Fingerprints:</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    allFingersCaptured ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {capturedCount}/5
                  </span>
                  {allFingersCaptured && (
                    <span className="text-xs text-green-600">✅ Complete</span>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-biomed-green transition-all duration-500"
                  style={{ width: `${(capturedCount / 5) * 100}%` }}
                />
              </div>

              {/* Capture Source Info */}
              {capturedCount > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Capture Source:</span>
                  <span className={`text-sm font-medium ${
                    Object.values(fingers).every(f => f.source === 'real_device') 
                      ? 'text-green-600' 
                      : Object.values(fingers).some(f => f.source === 'real_device')
                      ? 'text-yellow-600'
                      : 'text-yellow-600'
                  }`}>
                    {Object.values(fingers).every(f => f.source === 'real_device') 
                      ? '🟢 All REAL' 
                      : Object.values(fingers).some(f => f.source === 'real_device')
                      ? '🟡 Mixed'
                      : '🟡 All SIMULATED'}
                  </span>
                </div>
              )}

              {/* Profile Photo Status */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">Profile Photo:</span>
                <span className={`text-sm font-medium ${
                  webcamImage ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {webcamImage ? '✅ Captured' : '⏳ Pending'}
                </span>
              </div>

              {/* Upload Progress */}
              {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Uploading:</span>
                    <span className="text-sm font-medium text-blue-600">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Overall Status */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">Overall Status:</span>
                <span className={`text-sm font-medium ${
                  allFingersCaptured && webcamImage ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {allFingersCaptured && webcamImage ? '✅ Ready to submit' : '⏳ Incomplete'}
                </span>
              </div>

              {/* Scanner Mode Status */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">Scanner Mode:</span>
                <span className={`text-sm font-medium ${
                  captureSource === 'real_device' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {captureSource === 'real_device' ? '🟢 REAL' : '🟡 SIMULATED'}
                </span>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onBack}
              className="flex-1"
              disabled={isLoading || isSubmitting}
            >
              ← Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!allFingersCaptured || !webcamImage || isLoading || isSubmitting}
              className="flex-1"
              variant={allFingersCaptured && webcamImage ? 'primary' : 'secondary'}
            >
              {isLoading || isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" color="white" />
                  {isSubmitting ? `Uploading ${uploadProgress}%` : 'Creating Account...'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create Account & Save Biometrics
                </span>
              )}
            </Button>
          </div>

          {/* Validation Message */}
          {(!allFingersCaptured || !webcamImage) && !isLoading && !isSubmitting && !submitError && (
            <div className="text-xs text-yellow-600 text-center">
              {!allFingersCaptured && !webcamImage && '⚠️ Please capture all 5 fingerprints and a profile photo'}
              {!allFingersCaptured && webcamImage && `⚠️ Please capture ${5 - capturedCount} more fingerprint(s)`}
              {allFingersCaptured && !webcamImage && '⚠️ Please capture your profile photo'}
            </div>
          )}

          {/* Reset button */}
          {(allFingersCaptured || webcamImage) && !isLoading && !isSubmitting && (
            <Button
              variant="ghost"
              onClick={resetAll}
              className="w-full text-sm text-gray-500 hover:text-red-600"
              size="sm"
            >
              Reset All Biometrics
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step2Biometrics;