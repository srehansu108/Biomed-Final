import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { FiveFingerCapture } from '../../components/fingerprint/FiveFingerCapture';
import { QualityIndicator } from '../../components/fingerprint/QualityIndicator';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

const Step2Biometrics = ({ formData, onSubmit, onBack, isLoading }) => {
  const [fingers, setFingers] = useState({});
  const [webcamImage, setWebcamImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [capturedCount, setCapturedCount] = useState(0);
  const webcamRef = useRef(null);

  const fingerNames = [
    'right_thumb',
    'right_index', 
    'right_middle',
    'right_ring',
    'right_little'
  ];

  // ✅ Handle fingerprint progress updates
  const handleFingerprintProgress = (data) => {
    setCaptureProgress(data.progress);
    setCapturedCount(data.capturedCount);
    setFingers(data.capturedFingers || {});
  };

  // ✅ Handle fingerprint completion
  const handleFingerprintComplete = (capturedFingers) => {
    setFingers(capturedFingers);
    setCapturedCount(Object.keys(capturedFingers).length);
    setCaptureProgress(100);
  };

  const captureWebcam = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setWebcamImage(imageSrc);
      setIsCapturing(false);
    }
  };

  const allFingersCaptured = Object.keys(fingers).length === 5;

  const handleSubmit = () => {
    if (allFingersCaptured && webcamImage) {
      onSubmit({
        fingerprints: fingers,
        profileImage: webcamImage
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Biometric Setup</h2>
        <p className="text-gray-600 mt-2">
          Capture all five fingerprints and a profile photo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Fingerprint Capture */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Five Finger Scanning
            </h3>
            
            <FiveFingerCapture
              onComplete={handleFingerprintComplete}
              onProgress={handleFingerprintProgress}
            />
          </Card>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              💡 Tips for Best Results
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Place your finger flat on the scanner</li>
              <li>• Apply normal pressure</li>
              <li>• Ensure good lighting</li>
              <li>• Keep fingers clean and dry</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Webcam Capture + Status */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Profile Photo
            </h3>
            
            <div className="relative aspect-square max-w-sm mx-auto bg-gray-100 rounded-lg overflow-hidden">
              {webcamImage ? (
                <img
                  src={webcamImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  videoConstraints={{
                    width: 400,
                    height: 400,
                    facingMode: "user"
                  }}
                />
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <Button
                variant="secondary"
                onClick={webcamImage ? () => setWebcamImage(null) : captureWebcam}
                className="flex-1"
              >
                {webcamImage ? 'Retake' : 'Capture Photo'}
              </Button>
            </div>
          </Card>

          {/* ✅ Enrollment Status - Now shows correct counts */}
          <Card>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Enrollment Status
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fingerprints:</span>
                <span className={allFingersCaptured ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                  {capturedCount}/5 captured
                </span>
              </div>
              
              {/* ✅ Show progress bar for fingerprints */}
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-biomed-green transition-all duration-500"
                  style={{ width: `${(capturedCount / 5) * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Profile Photo:</span>
                <span className={webcamImage ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                  {webcamImage ? '✅ Captured' : '⏳ Pending'}
                </span>
              </div>

              {/* ✅ Show captured fingers list */}
              {capturedCount > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Captured fingers:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(fingers).map((finger) => (
                      <span key={finger} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {finger.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onBack}
              className="flex-1"
            >
              ← Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!allFingersCaptured || !webcamImage || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                'Create Account & Save Biometrics'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2Biometrics;