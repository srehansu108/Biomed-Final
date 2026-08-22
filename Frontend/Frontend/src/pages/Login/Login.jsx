import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFingerprint } from '../../hooks/useFingerprint';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { QualityIndicator } from '../../components/fingerprint/QualityIndicator';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { captureFingerprint, isCapturing, error: fingerprintError, status } = useFingerprint();
  
  const [email, setEmail] = useState('');
  const [fingerprintData, setFingerprintData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanStatus, setScanStatus] = useState('idle');

  // ✅ Load stored fingerprint data from registration
  useEffect(() => {
    // If you stored the fingerprint during registration
    const storedFingerprint = localStorage.getItem('userFingerprint');
    if (storedFingerprint) {
      setFingerprintData(storedFingerprint);
    }
  }, []);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  // ✅ NEW: Use stored fingerprint for login
  const handleUseStoredFingerprint = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }

    const storedFingerprint = localStorage.getItem('userFingerprint');
    if (!storedFingerprint) {
      setError('No stored fingerprint found. Please scan your fingerprint.');
      return;
    }

    setScanStatus('scanning');
    setError('');
    
    try {
      // Use the stored fingerprint data
      setFingerprintData(storedFingerprint);
      setScanStatus('success');
      await handleLogin(storedFingerprint);
    } catch (err) {
      setScanStatus('error');
      setError(err.message || 'Login failed');
    }
  };

  // ✅ ORIGINAL: Scan new fingerprint
  const handleScanFingerprint = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }

    setScanStatus('scanning');
    setError('');
    
    try {
      const result = await captureFingerprint('right_thumb');
      
      if (result.success) {
        setFingerprintData(result.data);
        setScanStatus('success');
        
        // ✅ Store this fingerprint data for future logins
        localStorage.setItem('userFingerprint', result.data);
        
        await handleLogin(result.data);
      } else {
        setScanStatus('error');
        setError(result.error || 'Failed to capture fingerprint');
      }
    } catch (err) {
      setScanStatus('error');
      setError(err.message || 'An error occurred during fingerprint capture');
    }
  };

  const handleLogin = async (fingerprint) => {
    setIsLoading(true);
    setError('');

    try {
      console.log('🔑 Attempting login with:', { email, fingerprintData: fingerprint });
      await login(email, fingerprint);
      navigate('/dashboard');
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      setScanStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = () => {
    switch (scanStatus) {
      case 'scanning':
        return {
          icon: '🔄',
          title: 'Authenticating...',
          description: 'Verifying your fingerprint',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      case 'success':
        return {
          icon: '✅',
          title: 'Fingerprint Verified!',
          description: 'Login successful',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'error':
        return {
          icon: '❌',
          title: 'Authentication Failed',
          description: 'Please try again',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        };
      default:
        return {
          icon: '🔐',
          title: 'Ready to Login',
          description: 'Scan your thumbprint or use stored fingerprint',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-biomed-green rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-3xl">B</span>
          </div>
          <h1 className="text-3xl font-bold text-biomed-green">BioMed</h1>
          <p className="text-gray-600 mt-1">Fingerprint Authentication System</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}

        {/* Login Form */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email"
            required
            disabled={isLoading || scanStatus === 'scanning'}
          />

          {/* Fingerprint Scanner Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fingerprint Verification
            </label>
            
            {/* Status Display */}
            <div className={`p-4 rounded-lg mb-4 ${statusDisplay.bgColor}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{statusDisplay.icon}</span>
                <div>
                  <h4 className={`font-semibold ${statusDisplay.color}`}>
                    {statusDisplay.title}
                  </h4>
                  <p className="text-sm text-gray-600">{statusDisplay.description}</p>
                </div>
              </div>
            </div>

            {/* Quality Indicator */}
            {scanStatus === 'success' && status?.quality && (
              <div className="mb-4">
                <QualityIndicator quality={status.quality} />
              </div>
            )}

            {/* ✅ Two Login Options */}
            <div className="space-y-3">
              {/* Option 1: Use Stored Fingerprint */}
              <Button
                onClick={handleUseStoredFingerprint}
                isLoading={isLoading}
                disabled={!email || isLoading}
                className="w-full"
                variant="primary"
              >
                {isLoading ? 'Authenticating...' : '🔑 Use Stored Fingerprint'}
              </Button>

              {/* Option 2: Scan New Fingerprint */}
              <Button
                onClick={handleScanFingerprint}
                isLoading={isCapturing || isLoading}
                disabled={!email || isCapturing || isLoading}
                className="w-full"
                variant="secondary"
              >
                {isCapturing ? 'Scanning...' : '🖐️ Scan New Fingerprint'}
              </Button>
            </div>

            {/* Status Message */}
            {scanStatus === 'success' && (
              <p className="text-sm text-green-600 text-center mt-2">
                ✅ Fingerprint verified successfully
              </p>
            )}
          </div>

          {/* Register Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-biomed-green font-medium hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            Secure biometric authentication
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;