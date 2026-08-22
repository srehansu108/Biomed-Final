// client/src/pages/Dashboard/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    fingerprints: 0,
    devices: 3,
    attendance: 0
  });

  // Simulated stats
  useEffect(() => {
    setStats({
      users: 1254,
      fingerprints: 5230,
      devices: 3,
      attendance: 892
    });
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.fullName || 'User'}!
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your biometric system
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Users"
                value={stats.users}
                icon="👥"
                color="text-blue-500"
              />
              <StatCard
                title="Fingerprints"
                value={stats.fingerprints}
                icon="🔐"
                color="text-green-500"
              />
              <StatCard
                title="Active Scanners"
                value={stats.devices}
                icon="📡"
                color="text-purple-500"
              />
              <StatCard
                title="Today's Attendance"
                value={stats.attendance}
                icon="📊"
                color="text-orange-500"
              />
            </div>

            {/* System Status */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                System Status
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-700 font-medium">All Systems Operational</span>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-700">Scanners: 3 Connected</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm text-gray-700">Database: Online</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span className="text-sm text-gray-700">API: Healthy</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;