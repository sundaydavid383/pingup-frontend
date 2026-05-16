import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosBase from '../../utils/axiosBase';
import toast from 'react-hot-toast';

/* ─── Shared helper components (uses sr-* CSS from Settings.jsx) ─── */

const Input = ({ label, type = 'text', value, onChange, placeholder, required, rightIcon }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label className="sr-label">{label}</label>}
    <div className="sr-input-wrap">
      <input
        className={`sr-input${rightIcon ? ' sr-input-has-icon' : ''}`}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
      {rightIcon}
    </div>
  </div>
);

const Toggle = ({ on, onToggle, disabled }) => (
  <button
    type="button"
    className={`sr-toggle-track${on ? ' sr-toggle-on custom-gradient' : ''}`}
    onClick={onToggle}
    disabled={disabled}
  >
    <div className="sr-toggle-thumb" />
  </button>
);

const SkeletonList = ({ n = 3 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="sr-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────────── */

const AccountSettings = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState('password');

  // password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  // form states
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [emailData, setEmailData] = useState({ newEmail: user?.email || '', password: '' });

  useEffect(() => {
    if (user?.email) setEmailData((prev) => ({ ...prev, newEmail: user.email }));
  }, [user]);

  // loading states
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // activity / devices
  const [loginActivity, setLoginActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activeDevices, setActiveDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [deviceLogoutLoading, setDeviceLogoutLoading] = useState({});

  // privacy
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showDob: false,
    showLastSeen: true,
    showOnlineStatus: true,
    readReceipts: true,
    allowFindByEmail: true,
  });
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacyDirty, setPrivacyDirty] = useState(false);

  /* ── fetch on tab change ── */
  useEffect(() => {
    if (activeTab === 'activity') fetchLoginActivity();
    if (activeTab === 'devices')  fetchActiveDevices();
    if (activeTab === 'privacy')  fetchPrivacySettings();
  }, [activeTab]);

  const formatDateTime = (value) => {
    if (!value) return 'Unknown time';
    return new Date(value).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  /* ── API calls ── */
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
    if (!current || !newPassword || !confirm) { toast.error('Please fill in all password fields'); return; }
    if (newPassword !== confirm) { toast.error('New passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosBase.put('/api/settings/change-password', {
        currentPassword: current,
        newPassword,
        confirmNewPassword: confirm,
      }, { headers: { Authorization: `Bearer ${token}` } });

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
    if (!emailData.newEmail || !emailData.password) { toast.error('Please enter a new email and your current password'); return; }
    if (emailData.newEmail === user?.email) { toast.error('Please enter a different email address'); return; }

    setEmailLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosBase.put('/api/settings/change-email', {
        newEmail: emailData.newEmail,
        password: emailData.password,
      }, { headers: { Authorization: `Bearer ${token}` } });

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
      if (res.data.success) { toast.success('Account deactivated successfully'); logout(); }
      else toast.error(res.data.message || 'Error deactivating account');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deactivating account');
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const password = window.prompt('Enter your password to permanently delete your account. This cannot be undone:');
    if (!password) return;
    if (!window.confirm('Are you absolutely sure? This is PERMANENT and cannot be undone!')) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosBase.delete('/api/settings/account', {
        data: { password },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) { toast.success('Account permanently deleted'); logout(); }
      else toast.error(res.data.message || 'Error deleting account');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting account');
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── Tab content renderer ── */
  const renderTabContent = () => {
    switch (activeTab) {

      case 'password':
        return (
          <div className="sr-page sr-stagger">
            <p className="sr-section-heading">Change Password</p>
            <form onSubmit={handlePasswordChange}>
              <Input
                label="Current Password"
                type={showPassword ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                required
                rightIcon={
                  <button type="button" className="sr-input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                required
                rightIcon={
                  <button type="button" className="sr-input-icon-btn" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                required
              />
              <button type="submit" className="sr-btn-primary custom-gradient" disabled={passwordLoading}>
                {passwordLoading ? 'Changing...' : 'Update Password'}
              </button>
            </form>
          </div>
        );

      case 'email':
        return (
          <div className="sr-page sr-stagger">
            <p className="sr-section-heading">Change Email Address</p>
            <form onSubmit={handleEmailChange}>
              <Input
                label="New Email"
                type="email"
                value={emailData.newEmail}
                onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                required
              />
              <Input
                label="Current Password"
                type={showEmailPassword ? 'text' : 'password'}
                value={emailData.password}
                onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                required
                rightIcon={
                  <button type="button" className="sr-input-icon-btn" onClick={() => setShowEmailPassword(!showEmailPassword)}>
                    {showEmailPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
              <button
                type="submit"
                className="sr-btn-primary custom-gradient"
                disabled={emailLoading || !emailData.newEmail || !emailData.password || emailData.newEmail === user?.email}
              >
                {emailLoading ? 'Updating...' : 'Update Email'}
              </button>
            </form>
          </div>
        );

      case 'activity':
        return (
          <div className="sr-page">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p className="sr-section-heading" style={{ margin: 0 }}>Login Activity</p>
              <span style={{ fontSize: '.73rem', color: 'var(--text-secondary)' }}>Most recent first</span>
            </div>

            {activityLoading ? <SkeletonList /> : loginActivity.length === 0 ? (
              <div className="sr-card" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '.85rem' }}>
                No recent login activity found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="sr-stagger">
                {loginActivity.map((item) => (
                  <div key={item.sessionId} className="sr-activity-item">
                    <div className="sr-activity-row">
                      <div style={{ minWidth: 0 }}>
                        <span className="sr-card-label">{item.deviceLabel}</span>
                        <p className="sr-activity-meta">{item.ip ? `IP: ${item.ip}` : 'IP not available'}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '.73rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                          {formatDateTime(item.lastActiveAt)}
                        </p>
                        <span className={`sr-badge ${item.isCurrent ? 'sr-badge-current' : 'sr-badge-other'}`}>
                          {item.isCurrent ? 'Current session' : item.status === 'logged_out' ? 'Logged out' : 'Success'}
                        </span>
                      </div>
                    </div>
                    <p className="sr-activity-meta" style={{ marginTop: 8 }}>
                      Browser: {item.browser} · OS: {item.os} · Session started: {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'devices':
        return (
          <div className="sr-page">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p className="sr-section-heading" style={{ margin: 0 }}>Devices Logged In</p>
              <span style={{ fontSize: '.73rem', color: 'var(--text-secondary)' }}>Manage active sessions</span>
            </div>

            {devicesLoading ? <SkeletonList /> : activeDevices.length === 0 ? (
              <div className="sr-card" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '.85rem' }}>
                No active sessions found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="sr-stagger">
                {activeDevices.map((device) => (
                  <div key={device.sessionId} className="sr-activity-item">
                    <div className="sr-activity-row" style={{ alignItems: 'center' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span className="sr-card-label">{device.deviceLabel}</span>
                        <p className="sr-activity-meta">{device.browser} · {device.os}</p>
                        <p className="sr-activity-meta">
                          IP: {device.ip || 'Unknown'} · {device.isCurrent ? 'This device' : 'Other device'} · {formatDateTime(device.lastActiveAt)}
                        </p>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {device.isCurrent ? (
                          <span className="sr-badge sr-badge-current">Current</span>
                        ) : (
                          <button
                            className="sr-logout-btn"
                            onClick={() => logoutRemoteDevice(device.sessionId)}
                            disabled={deviceLogoutLoading[device.sessionId]}
                          >
                            {deviceLogoutLoading[device.sessionId] ? 'Logging out...' : 'Logout'}
                          </button>
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
          <div className="sr-page">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
              <div>
                <p className="sr-section-heading" style={{ margin: 0 }}>Privacy Controls</p>
                <p style={{ fontSize: '.73rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Control what others can see and how they can find you.
                </p>
              </div>
              <button
                className="sr-btn-primary custom-gradient"
                style={{ width: 'auto', padding: '8px 16px', fontSize: '.8rem' }}
                onClick={savePrivacySettings}
                disabled={!privacyDirty || privacySaving}
              >
                {privacySaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {privacyLoading ? <SkeletonList n={6} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="sr-stagger">
                <div className="sr-card">
                  <label className="sr-label" style={{ marginBottom: 8 }}>Profile visibility</label>
                  <select
                    className="sr-select"
                    value={privacySettings.profileVisibility}
                    onChange={(e) => updatePrivacyValue('profileVisibility', e.target.value)}
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends only</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                {[
                  { field: 'showLastSeen',     label: 'Show last seen',          desc: '' },
                  { field: 'showOnlineStatus', label: 'Show online status',       desc: '' },
                  { field: 'readReceipts',     label: 'Read receipts',            desc: '' },
                  { field: 'showEmail',        label: 'Allow email visibility',   desc: 'Block email from being visible on your profile when off.' },
                  { field: 'allowFindByEmail', label: 'Allow discovery by email', desc: 'Allow people to find you by email address.' },
                ].map((setting) => (
                  <div key={setting.field} className="sr-card">
                    <div className="sr-card-row">
                      <div className="sr-card-text">
                        <span className="sr-card-label">{setting.label}</span>
                        {setting.desc && <span className="sr-card-desc">{setting.desc}</span>}
                      </div>
                      <Toggle
                        on={Boolean(privacySettings[setting.field])}
                        onToggle={() => updatePrivacyValue(setting.field, !privacySettings[setting.field])}
                      />
                    </div>
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

  /* ── Render ── */
  return (
    <div>
      {/* Header — only when not embedded inside Settings.jsx */}
      {!isEmbedded && (
        <div className="w-full max-w-2xl xl:max-w-4xl 2xl:max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 2xl:p-12">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <button
              onClick={() => navigate(-1)}
              className="sr-back-btn"
              style={{ width: 40, height: 40 }}
            >
              <ArrowLeft size={17} style={{ color: 'var(--text-main)' }} />
            </button>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-.02em' }}>
              Account Settings
            </h1>
          </div>
        </div>
      )}

      <div className={!isEmbedded ? 'w-full max-w-2xl xl:max-w-4xl 2xl:max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 2xl:p-12' : ''}>

        {/* Inner tab bar */}
        <div className="sr-inner-tabs">
          {['password', 'email', 'activity', 'devices', 'privacy'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`sr-inner-tab${activeTab === tab ? ' sr-inner-tab-active custom-gradient' : ''}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ marginBottom: 48 }}>
          {renderTabContent()}
        </div>

        {/* Danger Zone */}
        <div className="sr-danger-zone">
          <p className="sr-danger-title">⚠ Danger Zone</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="sr-btn-danger sr-btn-danger-orange"
              onClick={handleDeactivateAccount}
              disabled={deactivateLoading}
            >
              {deactivateLoading ? 'Processing...' : 'Deactivate Account (Reversible)'}
            </button>
            <button
              className="sr-btn-danger sr-btn-danger-red"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete Account (Permanent)'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AccountSettings;