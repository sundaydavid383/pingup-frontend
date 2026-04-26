import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosBase from '../../utils/axiosBase';

const PrivacySafety = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [saved, setSaved] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    viewPosts: 'public',
    viewStories: 'public',
    messageMe: 'public',
    commentPosts: 'public'
  });

  // Load settings from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axiosBase.get('/api/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.settings) {
          const { privacySettings: serverPrivacy } = res.data.settings;
          if (serverPrivacy?.profileVisibility) {
            setPrivacySettings(prev => ({
              ...prev,
              viewPosts: serverPrivacy.profileVisibility,
              viewStories: serverPrivacy.profileVisibility,
              messageMe: serverPrivacy.profileVisibility,
              commentPosts: serverPrivacy.profileVisibility
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch privacy settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = useCallback(async (settings = privacySettings) => {
    try {
      const token = localStorage.getItem('token');
      await axiosBase.put('/api/settings/privacy', {
        profileVisibility: settings.viewPosts
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save privacy settings:', err);
    }
  }, [privacySettings]);

  const privacyOptions = [
    { label: 'Everyone', value: 'public' },
    { label: 'Followers', value: 'friends' },
    { label: 'Only Me', value: 'private' }
  ];

  const privacyLabelMap = {
    public: 'Everyone',
    friends: 'Followers',
    private: 'Only Me'
  };

  const settingsList = [
    {
      id: 'viewPosts',
      label: 'Who can view my posts',
      description: 'Control post visibility',
      options: privacyOptions
    },
    {
      id: 'viewStories',
      label: 'Who can view my stories',
      description: 'Control story visibility',
      options: privacyOptions
    },
    {
      id: 'messageMe',
      label: 'Who can message me',
      description: 'Message request control',
      options: privacyOptions
    },
    {
      id: 'commentPosts',
      label: 'Who can comment on my posts',
      description: 'Comment visibility control',
      options: privacyOptions
    }
  ];

  const handleSettingChange = (settingId, value) => {
    const newSettings = { ...privacySettings, [settingId]: value };
    setPrivacySettings(newSettings);
    setSelectedSetting(null);
    saveSettings(newSettings);
  };

  const renderSubScreen = () => {
    if (!selectedSetting) return null;

    const setting = settingsList.find(s => s.id === selectedSetting);
    if (!setting) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center">
        <div
          className="w-full md:w-96 rounded-t-3xl md:rounded-2xl p-6 max-h-96 overflow-y-auto"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: 'white'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg" style={{ color: 'white' }}>
              {setting.label}
            </h3>
            <button
              onClick={() => setSelectedSetting(null)}
              className="text-2xl leading-none"
              style={{ color: 'white' }}
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {setting.options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:opacity-80 transition"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              >
                <input
                  type="radio"
                  name={setting.id}
                  value={option.value}
                  checked={privacySettings[setting.id] === option.value}
                  onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                  className="w-5 h-5 cursor-pointer"
                />
                <span style={{ color: 'white' }}>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {!isEmbedded && (
        <div className="max-w-2xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:opacity-70 transition"
              style={{ backgroundColor: 'var(--form-bg)' }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: 'white' }} />
            </button>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-main)' }}>
              Privacy & Safety
            </h1>
            {saved && (
              <span className="text-green-500 text-sm ml-auto">Saved!</span>
            )}
          </div>
        </div>
      )}
      <div className={!isEmbedded ? 'max-w-2xl mx-auto p-4 md:p-6' : ''}>
        {/* Privacy Settings */}
        <div className="space-y-3 mb-8">
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text-main)' }}>
            Privacy Control
          </h2>
          {settingsList.map((setting) => (
            <button
              key={setting.id}
              onClick={() => setSelectedSetting(setting.id)}
              className="w-full p-4 rounded-lg transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--form-bg)',
                border: '1px solid var(--input-border)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-medium" style={{ color: 'var(--text-main)' }}>
                    {setting.label}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Current: {privacyLabelMap[privacySettings[setting.id]] || privacySettings[setting.id]}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: 'white' }} />
              </div>
            </button>
          ))}
        </div>

        {/* Account Management */}
        <div className="space-y-3 mb-8">
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text-main)' }}>
            Account Management
          </h2>
          <button
            className="w-full p-4 rounded-lg transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: 'var(--form-bg)',
              border: '1px solid var(--input-border)'
            }}
          >
            <div className="text-left">
              <p className="font-medium" style={{ color: 'var(--text-main)' }}>
                Blocked Accounts
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Manage blocked users (0 blocked)
              </p>
            </div>
          </button>

          <button
            className="w-full p-4 rounded-lg transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: 'var(--form-bg)',
              border: '1px solid var(--input-border)'
            }}
          >
            <div className="text-left">
              <p className="font-medium" style={{ color: 'var(--text-main)' }}>
                Muted Accounts
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Manage muted users and notifications (0 muted)
              </p>
            </div>
          </button>
        </div>

        {/* Safety */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text-main)' }}>
            Safety & Reporting
          </h2>
          <button
            className="w-full p-4 rounded-lg transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: 'var(--form-bg)',
              border: '1px solid var(--input-border)'
            }}
          >
            <div className="text-left">
              <p className="font-medium" style={{ color: 'var(--text-main)' }}>
                Report History
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                View your report submissions (0 reports)
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Modal for privacy settings */}
      {renderSubScreen()}
    </div>
  );
};

export default PrivacySafety;
