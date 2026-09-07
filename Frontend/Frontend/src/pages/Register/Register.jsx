// client/src/pages/Register/Register.jsx - UPDATED WITH IMPROVED ERROR HANDLING

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/common/Card';
import { Alert } from '../../components/common/Alert';
import Step1Details from './Step1Details';
import Step2Biometrics from './Step2Biometrics';

// ✅ Utility: Convert base64 data URL to File object
const dataURLtoFile = (dataURL, filename = 'profile.jpg') => {
  if (!dataURL) return null;
  try {
    const arr = dataURL.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  } catch (error) {
    console.error('Error converting data URL to file:', error);
    return null;
  }
};

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(''); // 'phone', 'general', etc.

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: null,
    gender: '',
    maritalStatus: '',
    stateOfOrigin: '',
    localGovernment: '',
    city: '',
    residentialAddress: '',
    phone: '',
    alternatePhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    languages: {
      english: { read: false, write: false, speak: false, understand: false },
      yoruba: { read: false, write: false, speak: false, understand: false },
      igbo: { read: false, write: false, speak: false, understand: false },
      hausa: { read: false, write: false, speak: false, understand: false },
      other: { name: '', read: false, write: false, speak: false, understand: false }
    },
    languageNotes: '',
    dietaryHabit: '',
    idProofType: [],
    documents: [],
    education: [],
    occupation: '',
    remarks: '',
    fingerprints: {},
    profilePhoto: null,
    profileImage: null
  });

  const handleNextStep = () => {
    setStep(2);
    setError(''); // Clear error when moving forward
    setErrorType('');
  };

  // ✅ Handle going back to step 1 with a specific error message
  const handleGoBackWithError = (message, type = 'general') => {
    setError(message);
    setErrorType(type);
    setStep(1);
  };

  const handleBiometricsComplete = async (data) => {
    setIsLoading(true);
    setError('');
    setErrorType('');

    try {
      // ✅ Convert profileImage (base64) to File if it exists
      let profilePhotoFile = null;
      if (data.profileImage) {
        profilePhotoFile = dataURLtoFile(data.profileImage, 'profile_photo.jpg');
        if (!profilePhotoFile) {
          console.warn('⚠️ Failed to convert profile image to file, sending as base64 string');
        }
      }

      // ✅ Prepare registration data
      const registrationData = {
        ...formData,
        fingerprints: data.fingerprints || {},
        // ✅ Send as File if converted, otherwise send as base64 string
        profilePhoto: profilePhotoFile || data.profileImage || null,
        // ✅ CRITICAL: Send null instead of empty string for optional fields
        alternatePhone: formData.alternatePhone?.trim() || null,
        languageNotes: formData.languageNotes?.trim() || null,
        remarks: formData.remarks?.trim() || null,
        // ✅ Ensure phone is properly formatted
        phone: formData.phone?.trim() || '',
      };

      // ✅ Log data before sending (exclude sensitive data)
      console.log('📤 Registration data summary:', {
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        phone: registrationData.phone,
        fingerprintsCount: Object.keys(registrationData.fingerprints).length,
        hasProfilePhoto: !!registrationData.profilePhoto,
        languages: Object.keys(registrationData.languages || {})
      });

      await register(registrationData);
      navigate('/dashboard');
      
    } catch (err) {
      console.error('❌ Registration failed:', err);
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      
      // ✅ Detect phone-related errors
      if (errorMessage.toLowerCase().includes('phone') || 
          errorMessage.toLowerCase().includes('already registered')) {
        setErrorType('phone');
        // ✅ Auto-navigate back to step 1 with a clear message
        setError('⚠️ This phone number is already registered. Please use a different phone number.');
        setStep(1);
      } else {
        setErrorType('general');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-6xl w-full">
        {/* ✅ Global error display */}
        {error && step === 2 && (
          <Alert 
            type="error" 
            message={error} 
            className="mb-4"
            onClose={() => setError('')}
          />
        )}

        {/* ✅ Special error display for phone conflicts with action button */}
        {error && step === 1 && errorType === 'phone' && (
          <Alert 
            type="error" 
            message={error}
            className="mb-4"
            onClose={() => {
              setError('');
              setErrorType('');
            }}
          >
            <div className="mt-2 text-sm text-red-700">
              Please change your phone number and try again.
            </div>
          </Alert>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Volunteer Registration</h2>
            <span className="text-sm text-gray-500">Step {step} of 2</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-biomed-green transition-all duration-500"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 ? (
          <Step1Details
            formData={formData}
            setFormData={setFormData}
            onNext={handleNextStep}
            isLoading={isLoading}
            // ✅ Pass error to Step1 for display
            error={errorType === 'phone' ? error : ''}
          />
        ) : (
          <Step2Biometrics
            formData={formData}
            onSubmit={handleBiometricsComplete}
            onBack={() => {
              setError('');
              setErrorType('');
              setStep(1);
            }}
            isLoading={isLoading}
            error={error}
          />
        )}
      </Card>
    </div>
  );
};

export default Register;