// client/src/pages/Register/Register.jsx - FIXED

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/common/Card';
import { Alert } from '../../components/common/Alert';
import Step1Details from './Step1Details';
import Step2Biometrics from './Step2Biometrics';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Initialize all fields properly
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: null,  // Store as Date object
    gender: '',
    maritalStatus: '',
    
    // Location
    stateOfOrigin: '',
    localGovernment: '',
    city: '',
    residentialAddress: '',
    
    // Contact
    phone: '',
    alternatePhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    
    // Languages
    languages: {
      english: { read: false, write: false, speak: false, understand: false },
      yoruba: { read: false, write: false, speak: false, understand: false },
      'Igbo Hausa': { read: false, write: false, speak: false, understand: false },
      other: { name: '', read: false, write: false, speak: false, understand: false }
    },
    languageNotes: '',
    
    // Dietary
    dietaryHabit: '',
    
    // Documents
    idProofType: [],
    documents: [],
    
    // Education & Occupation
    education: [],
    occupation: '',
    remarks: '',
    
    // Biometrics
    fingerprints: {},   // Will be filled in Step2
    profilePhoto: null, // File object
    profileImage: null  // Base64 from webcam
  });

  const handleNextStep = () => {
    setStep(2);
  };

  const handleBiometricsComplete = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      // ✅ Combine all form data
      const registrationData = {
        ...formData,
        fingerprints: data.fingerprints || {},
        profilePhoto: data.profileImage ? null : formData.profilePhoto, // Use file if available
        profileImage: data.profileImage || null, // Use webcam image
        // Ensure required fields are present
      };

      // ✅ Log data before sending
      console.log('📤 Registration data:', {
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        phone: registrationData.phone,
        hasProfilePhoto: !!registrationData.profilePhoto,
        hasProfileImage: !!registrationData.profileImage,
        fingerprintsCount: Object.keys(registrationData.fingerprints).length,
        documentsCount: registrationData.documents?.length || 0
      });

      await register(registrationData);
      navigate('/dashboard');
      
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-6xl w-full">
        {error && (
          <Alert type="error" message={error} className="mb-4" />
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
          />
        ) : (
          <Step2Biometrics
            formData={formData}
            onSubmit={handleBiometricsComplete}
            onBack={() => setStep(1)}
            isLoading={isLoading}
          />
        )}
      </Card>
    </div>
  );
};

export default Register;