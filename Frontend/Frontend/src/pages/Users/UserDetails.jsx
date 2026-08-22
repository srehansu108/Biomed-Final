import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { Alert } from '../../components/common/Alert';
import { QualityIndicator } from '../../components/fingerprint/QualityIndicator';
import axiosInstance from '../../api/axiosConfig';
import { ENDPOINTS } from '../../api/endpoints';
import { formatDate, getInitials, getStatusColor } from '../../utils/helpers';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [fingerprints, setFingerprints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    loadUserDetails();
  }, [id]);

  const loadUserDetails = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get(ENDPOINTS.USERS.GET_BY_ID(id));
      setUser(response.data.data.user);
      setFingerprints(response.data.data.fingerprints || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Change status to ${newStatus}?`)) return;
    
    setIsUpdatingStatus(true);
    try {
      await axiosInstance.patch(ENDPOINTS.USERS.UPDATE_STATUS(id), { status: newStatus });
      await loadUserDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await axiosInstance.delete(ENDPOINTS.USERS.DELETE(id));
      navigate('/users');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <Spinner size="lg" />
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <Alert type="error" message="User not found" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate('/users')} className="text-gray-600 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
              </div>
              {currentUser?.role === 'admin' && (
                <Button variant="danger" onClick={handleDeleteUser}>
                  Delete User
                </Button>
              )}
            </div>

            {error && <Alert type="error" message={error} className="mb-4" />}

            {/* User Info Card */}
            <Card className="mb-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-biomed-green to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                  {getInitials(user.fullName)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{user.fullName}</h2>
                    <span className={`badge ${getStatusColor(user.status)}`}>
                      {user.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">User ID:</span>
                      <span className="ml-2 font-medium text-gray-900">{user._id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-900">{user.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <span className="ml-2 text-gray-900">{user.phone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Role:</span>
                      <span className="ml-2 text-gray-900 capitalize">{user.role}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Joined:</span>
                      <span className="ml-2 text-gray-900">{formatDate(user.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Login:</span>
                      <span className="ml-2 text-gray-900">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              {currentUser?.role === 'admin' && user.status !== 'suspended' && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                  {user.status !== 'active' && (
                    <Button size="sm" onClick={() => handleStatusUpdate('active')}>
                      Activate
                    </Button>
                  )}
                  {user.status !== 'inactive' && (
                    <Button variant="secondary" size="sm" onClick={() => handleStatusUpdate('inactive')}>
                      Deactivate
                    </Button>
                  )}
                  {user.status !== 'suspended' && (
                    <Button variant="danger" size="sm" onClick={() => handleStatusUpdate('suspended')}>
                      Suspend
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {/* Fingerprints Card */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Registered Fingerprints
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({fingerprints.length} templates)
                </span>
              </h3>

              {fingerprints.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No fingerprints registered</p>
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
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Quality</span>
                          <QualityIndicator quality={fp.qualityScore} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Type</span>
                          <span className="text-gray-700">{fp.format || 'ISO'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Created</span>
                          <span className="text-gray-700">{formatDate(fp.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Verifications</span>
                          <span className="text-gray-700">{fp.verificationCount || 0}</span>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-400">
                        Template ID: {fp._id.slice(-8).toUpperCase()}
                      </div>
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

export default UserDetails;