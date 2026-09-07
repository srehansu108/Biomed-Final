// client/src/pages/Register/Register.jsx - FULLY FIXED

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
  };

  const handleBiometricsComplete = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      // ✅ Prepare registration data
      const registrationData = {
        ...formData,
        fingerprints: data.fingerprints || {},
        profilePhoto: data.profileImage ? null : formData.profilePhoto,
        profileImage: data.profileImage || null,
        // ✅ CRITICAL: Send null instead of empty string for optional fields
        alternatePhone: formData.alternatePhone?.trim() || null,
        languageNotes: formData.languageNotes?.trim() || null,
        remarks: formData.remarks?.trim() || null,
      };

      // ✅ Log data before sending
      console.log('📤 Registration data:', {
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        phone: registrationData.phone,
        alternatePhone: registrationData.alternatePhone,
        fingerprintsCount: Object.keys(registrationData.fingerprints).length,
        languages: Object.keys(registrationData.languages)
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