// client/src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar = () => {
  const navItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/users', icon: '👥', label: 'Users' },
    { path: '/fingerprints', icon: '🔐', label: 'Fingerprints' },
    { path: '/verify', icon: '✅', label: 'Verify Fingerprint' },
    { path: '/devices', icon: '📡', label: 'Devices' },
    { path: '/attendance', icon: '📋', label: 'Attendance' },
    { path: '/reports', icon: '📈', label: 'Reports' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 sticky top-16">
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-biomed-green text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            © 2024 BioMed System
            <br />
            All rights reserved
          </p>
        </div>
      </div>
    </aside>
  );
};