import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosBase from '../../utils/axiosBase';
import toast from 'react-hot-toast';

const AccountSettings = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('password'); // password, email, activity, devices
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  // Form states
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [emailData, setEmailData] = useState({
    newEmail: user?.email || '',
    password: ''
  });

  useEffect(() => {
    if (user?.email) {
      setEmailData((prev) => ({ ...prev, newEmail: user.email }));
    }
  }, [user]);

  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const [loginActivity, setLoginActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activeDevices, setActiveDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [deviceLogoutLoading, setDeviceLogoutLoading] = useState({});
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showDob: false,
    showLastSeen: true,
    showOnlineStatus: true,
    readReceipts: true,
    allowFindByEmail: true
  });
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacyDirty, setPrivacyDirty] = useState(false);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchLoginActivity();
    }
    if (activeTab === 'devices') {
      fetchActiveDevices();
    }
    if (activeTab === 'privacy') {
      fetchPrivacySettings();
    }
  }, [activeTab]);

  const formatDateTime = (value) => {
    if (!value) return 'Unknown time';
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const fetchLoginActivity = async () => {
    setActivityLoading(true);
    try {
      const res = await axiosBase.get('/api/settings/login-activity');
      setLoginActivity(res.data.activity || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load login activity.');
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchActiveDevices = async () => {
    setDevicesLoading(true);
    try {
      const res = await axiosBase.get('/api/settings/devices');
      setActiveDevices(res.data.devices || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load devices.');
    } finally {
      setDevicesLoading(false);
    }
  };

  const fetchPrivacySettings = async () => {
    setPrivacyLoading(true);
    try {
      const res = await axiosBase.get('/api/settings/privacy');
      setPrivacySettings(res.data.privacySettings || privacySettings);
      setPrivacyDirty(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load privacy settings.');
    } finally {
      setPrivacyLoading(false);
    }
  };

  const updatePrivacyValue = (field, value) => {
    setPrivacySettings((prev) => ({ ...prev, [field]: value }));
    setPrivacyDirty(true);
  };

  const savePrivacySettings = async () => {
    setPrivacySaving(true);
    try {
      const res = await axiosBase.put('/api/settings/privacy', privacySettings);
      setPrivacySettings(res.data.privacySettings || privacySettings);
      setPrivacyDirty(false);
      toast.success('Privacy settings saved.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save privacy settings.');
    } finally {
      setPrivacySaving(false);
    }
  };

  const logoutRemoteDevice = async (sessionId) => {
    setDeviceLogoutLoading((prev) => ({ ...prev, [sessionId]: true }));
    try {
      await axiosBase.post(`/api/settings/logout-session/${sessionId}`);
      toast.success('Session logged out successfully.');
      fetchActiveDevices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to log out this session.');
    } finally {
      setDeviceLogoutLoading((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    const { current, new: newPassword, confirm } = passwords;

    if (!current || !newPassword || !confirm) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirm) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosBase.put('/api/settings/change-password', {
        currentPassword: current,
        newPassword,
        confirmNewPassword: confirm
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        toast.success('Password changed successfully');
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        toast.error(res.data.message || 'Failed to change password. Please check your current password and try again.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password. Please check your current password and try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();

    if (!emailData.newEmail || !emailData.password) {
      toast.error('Please enter a new email and your current password');
      return;
    }

    if (emailData.newEmail === user?.email) {
      toast.error('Please enter a different email address');
      return;
    }

    setEmailLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosBase.put('/api/settings/change-email', {
        newEmail: emailData.newEmail,
        password: emailData.password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        toast.success('Email updated successfully');
        setEmailData({ newEmail: emailData.newEmail, password: '' });
        updateUser?.({ ...user, email: emailData.newEmail });
      } else {
        toast.error(res.data.message || 'Failed to update email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    const password = window.prompt('Enter your password to deactivate account:');
    if (!password) return;
    
    setDeactivateLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosBase.post('/api/settings/deactivate', 
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        toast.success('Account deactivated successfully');
        logout();
      } else {
        toast.error(res.data.message || 'Error deactivating account');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deactivating account');
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const password = window.prompt('Enter your password to permanently delete your account. This cannot be undone:');
    if (!password) return;
    
    if (!window.confirm('Are you absolutely sure? This is PERMANENT and cannot be undone!')) {
      return;
    }
    
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosBase.delete('/api/settings/account', {
        data: { password },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        toast.success('Account permanently deleted');
        logout();
      } else {
        toast.error(res.data.message || 'Error deleting account');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting account');
    } finally {
      setDeleteLoading(false);
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
                        className="w-full px-4 py-3 sm:py-2 rounded-lg min-h-[44px]"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--white)]"
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
                        className="w-full px-4 py-3 sm:py-2 rounded-lg min-h-[44px]"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--white)]"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" style={{ color: 'var(--white)' }} /> : <Eye className="w-4 h-4" style={{ color: '[var(--white)]' }} />}
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
                    className="w-full px-4 py-3 sm:py-2 rounded-lg min-h-[44px]"
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
                  className="w-full px-4 py-3 sm:py-2 rounded-lg custom-gradient text-[var(--white)] font-semibold disabled:opacity-50 min-h-[44px]"
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
                    New Email
                  </label>
                  <input
                    type="email"
                    value={emailData.newEmail}
                    onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                    className="w-full px-4 py-3 sm:py-2 rounded-lg min-h-[44px]"
                    style={{
                      backgroundColor: 'var(--form-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-main)'
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-main)' }}>
                    Current Password
                  </label>
                  <div className="relative">
                      <input
                        type={showEmailPassword ? 'text' : 'password'}
                        value={emailData.password}
                        onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                        className="w-full px-4 py-3 sm:py-2 rounded-lg min-h-[44px]"
                        style={{
                          backgroundColor: 'var(--form-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--text-main)'
                        }}
                        required
                      />
                    <button
                      type="button"
                      onClick={() => setShowEmailPassword(!showEmailPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--white)]"
                    >
                      {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={emailLoading || !emailData.newEmail || !emailData.password || emailData.newEmail === user?.email}
                  className="w-full px-4 py-3 sm:py-2 rounded-lg custom-gradient text-[var(--white)] font-semibold disabled:opacity-50 min-h-[44px]"
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
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: 'var(--text-main)' }}>
                Login Activity
              </h3>
              <span className="text-sm text-[var(--text-secondary)]">Most recent first</span>
            </div>

            {activityLoading ? (
              <div className="rounded-lg border border-white/10 bg-[var(--form-bg)] p-6 text-center text-[var(--text-secondary)]">
                Loading activity...
              </div>
            ) : loginActivity.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-[var(--form-bg)] p-6 text-center text-[var(--text-secondary)]">
                No recent login activity found.
              </div>
            ) : (
              <div className="space-y-4">
                {loginActivity.map((item) => (
                  <div key={item.sessionId} className="rounded-2xl border border-white/10 bg-[var(--form-bg)] p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-main)' }}>
                          {item.deviceLabel}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {item.ip ? `IP: ${item.ip}` : 'IP not available'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[var(--text-secondary)]">{formatDateTime(item.lastActiveAt)}</p>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${item.isCurrent ? 'bg-[var(--primary)] text-white' : 'bg-white/10 text-[var(--text-secondary)]'}`}>
                          {item.isCurrent ? 'Current session' : item.status === 'logged_out' ? 'Logged out' : 'Success'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-[var(--text-secondary)]">
                      <p>Browser: {item.browser}</p>
                      <p>OS: {item.os}</p>
                      <p>Session started: {formatDateTime(item.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'devices':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: 'var(--text-main)' }}>
                Devices Logged In
              </h3>
              <span className="text-sm text-[var(--text-secondary)]">Manage active sessions</span>
            </div>

            {devicesLoading ? (
              <div className="rounded-lg border border-white/10 bg-[var(--form-bg)] p-6 text-center text-[var(--text-secondary)]">
                Loading devices...
              </div>
            ) : activeDevices.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-[var(--form-bg)] p-6 text-center text-[var(--text-secondary)]">
                No active sessions found.
              </div>
            ) : (
              <div className="space-y-4">
                {activeDevices.map((device) => (
                  <div key={device.sessionId} className="rounded-2xl border border-white/10 bg-[var(--form-bg)] p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-main)' }}>
                          {device.deviceLabel}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {device.browser} • {device.os}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">IP: {device.ip || 'Unknown'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-sm text-[var(--text-secondary)]">
                          <p>{device.isCurrent ? 'This device' : 'Other device'}</p>
                          <p>{formatDateTime(device.lastActiveAt)}</p>
                        </div>
                        {!device.isCurrent ? (
                          <button
                            onClick={() => logoutRemoteDevice(device.sessionId)}
                            disabled={deviceLogoutLoading[device.sessionId]}
                            className="rounded-lg border border-red-500 bg-red-500 px-3 py-3 sm:py-2 text-sm font-semibold text-white transition disabled:opacity-50 min-h-[44px]"
                          >
                            {deviceLogoutLoading[device.sessionId] ? 'Logging out...' : 'Logout'}
                          </button>
                        ) : (
                          <span className="rounded-full bg-[var(--primary)] px-3 py-3 sm:py-2 text-xs font-semibold text-white min-h-[44px] flex items-center">Current</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-main)' }}>
                  Privacy Controls
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">Control what others can see and how they can find you.</p>
              </div>
              <button
                onClick={savePrivacySettings}
                disabled={!privacyDirty || privacySaving}
                className="rounded-lg bg-[var(--primary)] px-4 py-3 sm:py-2 text-sm font-semibold text-white disabled:opacity-50 min-h-[44px]"
              >
                {privacySaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {privacyLoading ? (
              <div className="rounded-lg border border-white/10 bg-[var(--form-bg)] p-6 text-center text-[var(--text-secondary)]">
                Loading privacy settings...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-[var(--form-bg)] p-4">
                  <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                    Profile visibility
                  </label>
                  <select
                    value={privacySettings.profileVisibility}
                    onChange={(e) => updatePrivacyValue('profileVisibility', e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/10 px-3 py-3 sm:py-2 text-white min-h-[44px]"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends only</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                {[
                  { field: 'showLastSeen', label: 'Show last seen' },
                  { field: 'showOnlineStatus', label: 'Show online status' },
                  { field: 'readReceipts', label: 'Read receipts' },
                  { field: 'showEmail', label: 'Allow email visibility' },
                  { field: 'allowFindByEmail', label: 'Allow discovery by email' }
                ].map((setting) => (
                  <div key={setting.field} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[var(--form-bg)] p-4">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-main)' }}>{setting.label}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{setting.field === 'showEmail' ? 'Block email from being visible on your profile when off.' : setting.field === 'allowFindByEmail' ? 'Allow people to find you by email address.' : ''}</p>
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(privacySettings[setting.field])}
                        onChange={(e) => updatePrivacyValue(setting.field, e.target.checked)}
                        className="h-5 w-5 sm:h-6 sm:w-6 rounded border border-white/10 bg-black/10 text-[var(--primary)]"
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
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
        <div className="w-full max-w-2xl xl:max-w-4xl 2xl:max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 2xl:p-12">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg hover:opacity-70 transition"
              style={{ backgroundColor: 'var(--form-bg)' }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: '[var(--white)]' }} />
            </button>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-main)' }}>
              Account Settings
            </h1>
          </div>
        </div>
      )}

      <div className={!isEmbedded ? 'w-full max-w-2xl xl:max-w-4xl 2xl:max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 2xl:p-12' : ''}>
        {/* Tab Navigation */}
        <div className="flex gap-1 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2">
          {['password', 'email', 'activity', 'devices', 'privacy'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-3 sm:py-2 rounded-lg whitespace-nowrap font-medium transition min-h-[44px] ${activeTab === tab
                  ? 'custom-gradient text-[var(--white)]'
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
              className="w-full px-4 py-3 sm:py-2 rounded-lg font-semibold border-2 border-orange-500 text-orange-600 hover:bg-orange-50 transition min-h-[44px]"
            >
              Deactivate Account (Reversible)
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full px-4 py-3 sm:py-2 rounded-lg font-semibold border-2 border-red-600 text-red-600 hover:bg-red-50 transition min-h-[44px]"
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
