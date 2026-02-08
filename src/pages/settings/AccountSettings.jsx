import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AccountSettings = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('password'); // password, email, activity, devices
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form states
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [email, setEmail] = useState(user?.email || '');
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert('Passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      // TODO: Implement password change API call
      console.log('Password change:', passwords);
      alert('Password changed successfully');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      alert('Error changing password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      // TODO: Implement email change API call
      console.log('Email change:', email);
      alert('Email updated successfully');
    } catch (error) {
      alert('Error updating email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDeactivateAccount = () => {
    if (window.confirm('Are you sure you want to deactivate your account? This action can be undone within 30 days.')) {
      // TODO: Implement account deactivation
      console.log('Account deactivation initiated');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('This action is irreversible. Are you sure you want to permanently delete your account?')) {
      // TODO: Implement account deletion
      console.log('Account deletion initiated');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'password':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-main)' }}>
                Change Password
              </h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-main)' }}>
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: 'var(--form-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-main)'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-main)' }}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: 'var(--form-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-main)'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-main)' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg"
                    style={{
                      backgroundColor: 'var(--form-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-main)'
                    }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full px-4 py-2 rounded-lg custom-gradient text-white font-semibold disabled:opacity-50"
                >
                  {passwordLoading ? 'Changing...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-main)' }}>
                Email Address
              </h3>
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-main)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg"
                    style={{
                      backgroundColor: 'var(--form-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-main)'
                    }}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={emailLoading || email === user?.email}
                  className="w-full px-4 py-2 rounded-lg custom-gradient text-white font-semibold disabled:opacity-50"
                >
                  {emailLoading ? 'Updating...' : 'Update Email'}
                </button>
              </form>
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-main)' }}>
              Login Activity
            </h3>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--form-bg)', border: '1px solid var(--input-border)' }}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-main)' }}>
                    Last Login
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                    2 hours ago from Chrome on Windows
                  </p>
                </div>
                <span style={{ color: 'var(--text-secondary)' }} className="text-xs">
                  Current
                </span>
              </div>
            </div>
          </div>
        );

      case 'devices':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-main)' }}>
              Devices Logged In
            </h3>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--form-bg)', border: '1px solid var(--input-border)' }}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-main)' }}>
                    Chrome on Windows
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                    Last active: 2 hours ago
                  </p>
                </div>
                <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                  Logout
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* Only show header if not embedded */}
      {!isEmbedded && (
        <div className="max-w-2xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:opacity-70 transition"
              style={{ backgroundColor: 'var(--form-bg)' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-main)' }}>
              Account Settings
            </h1>
          </div>
        </div>
      )}

      <div className={!isEmbedded ? 'max-w-2xl mx-auto p-4 md:p-6' : ''}>
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['password', 'email', 'activity', 'devices'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition ${
                activeTab === tab
                  ? 'custom-gradient text-white'
                  : ''
              }`}
              style={
                activeTab === tab
                  ? {}
                  : {
                      backgroundColor: 'var(--form-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-main)'
                    }
              }
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mb-12">
          {renderTabContent()}
        </div>

        {/* Danger Zone */}
        <div className="border-t pt-8" style={{ borderColor: 'var(--input-border)' }}>
          <h3 className="font-semibold text-red-600 mb-4 text-lg">Danger Zone</h3>
          <div className="space-y-3">
            <button
              onClick={handleDeactivateAccount}
              className="w-full px-4 py-2 rounded-lg font-semibold border-2 border-orange-500 text-orange-600 hover:bg-orange-50 transition"
            >
              Deactivate Account (Reversible)
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full px-4 py-2 rounded-lg font-semibold border-2 border-red-600 text-red-600 hover:bg-red-50 transition"
            >
              Delete Account (Permanent)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
