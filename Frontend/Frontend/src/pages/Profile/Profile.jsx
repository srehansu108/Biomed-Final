import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFingerprint } from '../../hooks/useFingerprint';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { Spinner } from '../../components/common/Spinner';
import { QualityIndicator } from '../../components/fingerprint/QualityIndicator';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { getMyFingerprints, deleteFingerprint } = useFingerprint();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fingerprints, setFingerprints] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    gender: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        gender: user.gender || '',
        address: user.address || '',
      });
    }
    loadFingerprints();
  }, [user]);

  const loadFingerprints = async () => {
    try {
      const data = await getMyFingerprints();
      setFingerprints(data || []);
    } catch (err) {
      console.error('Failed to load fingerprints:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFingerprint = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fingerprint?')) return;
    
    try {
      await deleteFingerprint(id);
      await loadFingerprints();
      setSuccess('Fingerprint deleted successfully');
    } catch (err) {
      setError(err.message || 'Failed to delete fingerprint');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

            {error && <Alert type="error" message={error} className="mb-4" />}
            {success && <Alert type="success" message={success} className="mb-4" />}

            {/* User Info Card */}
            <Card className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
                <Button
                  variant={isEditing ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => {
                    if (isEditing) {
                      setFormData({
                        fullName: user?.fullName || '',
                        phone: user?.phone || '',
                        gender: user?.gender || '',
                        address: user?.address || '',
                      });
                    }
                    setIsEditing(!isEditing);
                    setError('');
                    setSuccess('');
                  }}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      label="Phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="input-field"
                      rows="3"
                    />
                  </div>
                  <Button type="submit" isLoading={isLoading}>
                    Save Changes
                  </Button>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="text-gray-900 font-medium">{user?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900 font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900 font-medium">{user?.phone || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="text-gray-900 font-medium">{user?.gender || 'Not set'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900 font-medium">{user?.address || 'Not set'}</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Fingerprints Card */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Registered Fingerprints
              </h3>
              {fingerprints.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No fingerprints registered yet
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fingerprints.map((fp) => (
                    <div
                      key={fp._id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-card transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {fp.fingerType?.replace('_', ' ').toUpperCase()}
                        </span>
                        {fp.isPrimary && (
                          <span className="badge-success text-xs">Primary</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Quality</span>
                        <QualityIndicator quality={fp.qualityScore} size="sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-gray-500">Type</span>
                        <span className="text-gray-700">{fp.format || 'ISO'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Created</span>
                        <span className="text-gray-700">
                          {new Date(fp.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => handleDeleteFingerprint(fp._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;