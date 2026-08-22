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
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: '',
    address: '',
  });
  const [fingerprints, setFingerprints] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNextStep = () => {
    // Validate required fields
    const required = ['fullName', 'email', 'phone'];
    const missing = required.filter(field => !formData[field]);
    
    if (missing.length > 0) {
      setError(`Please fill in all required fields: ${missing.join(', ')}`);
      return;
    }
    
    setError('');
    setStep(2);
  };

  const handleBiometricsComplete = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      const registrationData = {
        ...formData,
        fingerprints: data.fingerprints || fingerprints,
        profileImage: data.profileImage || profileImage,
      };

      await register(registrationData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full">
        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
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