import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosBase from '../../utils/axiosBase';

const PrivacySafety = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useState(false);

  const [privacy, setPrivacy] = useState({
    viewPosts: 'public',
    viewStories: 'public',
    messageMe: 'public',
    commentPosts: 'public'
  });

  // =========================
  // OPTIONS / LABELS
  // =========================
  const OPTIONS = [
    { label: 'Everyone', value: 'public' },
    { label: 'Followers', value: 'friends' },
    { label: 'Only Me', value: 'private' }
  ];

  const LABEL_MAP = {
    public: 'Everyone',
    friends: 'Followers',
    private: 'Only Me'
  };

  const SETTINGS = [
    {
      id: 'viewPosts',
      label: 'Who can view my posts',
      desc: 'Control post visibility'
    },
    {
      id: 'viewStories',
      label: 'Who can view my stories',
      desc: 'Control story visibility'
    },
    {
      id: 'messageMe',
      label: 'Who can message me',
      desc: 'Message request control'
    },
    {
      id: 'commentPosts',
      label: 'Who can comment on my posts',
      desc: 'Comment visibility control'
    }
  ];

  // =========================
  // FETCH SETTINGS
  // =========================
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await axiosBase.get('/api/settings', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.data.success && res.data.settings) {
          const { privacySettings } = res.data.settings;

          if (privacySettings?.profileVisibility) {
            setPrivacy({
              viewPosts: privacySettings.profileVisibility,
              viewStories: privacySettings.profileVisibility,
              messageMe: privacySettings.profileVisibility,
              commentPosts: privacySettings.profileVisibility
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch privacy settings:', err);
      }
    };

    fetchSettings();
  }, []);

  // =========================
  // SAVE SETTINGS
  // =========================
  const saveSettings = useCallback(async (newPrivacy) => {
    try {
      const token = localStorage.getItem('token');

      await axiosBase.put(
        '/api/settings/privacy',
        {
          profileVisibility: newPrivacy.viewPosts
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2200);

    } catch (err) {
      console.error('Failed to save privacy settings:', err);
    }
  }, []);

  // =========================
  // HANDLE CHANGE
  // =========================
  const handleChange = (settingId, value) => {
    const updated = {
      ...privacy,
      [settingId]: value
    };

    setPrivacy(updated);
    setSelected(null);

    saveSettings(updated);
  };

  const activeSetting = SETTINGS.find((s) => s.id === selected);

  return (
    <div className="sr-page sr-stagger">
      {/* ================= HEADER ================= */}
      {!isEmbedded && (
        <div className="max-w-2xl mx-auto p-4 md:p-6">
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: 'var(--form-bg)',
                border: '1px solid var(--input-border)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
              }}
            >
              <ArrowLeft
                className="w-5 h-5"
                style={{ color: 'var(--text-main)' }}
              />
            </button>

            <div className="flex-1">
              <h1
                className="text-2xl md:text-3xl font-bold"
                style={{
                  color: 'var(--text-main)',
                  letterSpacing: '-0.03em'
                }}
              >
                Privacy & Safety
              </h1>

              <p
                className="text-sm mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Manage your privacy, safety, and interaction preferences
              </p>
            </div>

            {saved && (
              <div
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  background: 'rgba(34,197,94,0.15)',
                  color: '#22c55e',
                  border: '1px solid rgba(34,197,94,0.25)'
                }}
              >
                Saved
              </div>
            )}
          </div>
        </div>
      )}

      <div className={!isEmbedded ? 'max-w-2xl mx-auto p-4 md:p-6' : ''}>
        {/* ================= PRIVACY ================= */}
        <div className="mb-10">
          <p className="sr-section-heading">
            Privacy Control
          </p>

          <div className="flex flex-col gap-3 mt-4">
            {SETTINGS.map((setting) => (
              <button
                key={setting.id}
                onClick={() => setSelected(setting.id)}
                className="sr-card transition-all duration-300 hover:scale-[1.015] active:scale-[0.99]"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: '1px solid var(--input-border)',
                  background: 'var(--form-bg)',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.06)'
                }}
              >
                <div className="sr-card-row">
                  <div className="sr-card-text">
                    <span className="sr-card-label">
                      {setting.label}
                    </span>

                    <span className="sr-card-desc">
                      Current: {LABEL_MAP[privacy[setting.id]]}
                    </span>
                  </div>

                  <ChevronRight
                    size={18}
                    style={{
                      color: 'var(--text-secondary)',
                      flexShrink: 0
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ================= ACCOUNT ================= */}
        <div className="mb-10">
          <p className="sr-section-heading">
            Account Management
          </p>

          <div className="flex flex-col gap-3 mt-4">
            {[
              {
                title: 'Blocked Accounts',
                desc: 'Manage blocked users (0 blocked)'
              },
              {
                title: 'Muted Accounts',
                desc: 'Manage muted users and notifications (0 muted)'
              }
            ].map((item) => (
              <div
                key={item.title}
                className="sr-card"
                style={{
                  border: '1px solid var(--input-border)',
                  background: 'var(--form-bg)',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.06)'
                }}
              >
                <span className="sr-card-label">
                  {item.title}
                </span>

                <span
                  className="sr-card-desc"
                  style={{ marginTop: 3 }}
                >
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ================= SAFETY ================= */}
        <div>
          <p className="sr-section-heading">
            Safety & Reporting
          </p>

          <div
            className="sr-card mt-4"
            style={{
              border: '1px solid var(--input-border)',
              background: 'var(--form-bg)',
              boxShadow: '0 6px 18px rgba(0,0,0,0.06)'
            }}
          >
            <span className="sr-card-label">
              Report History
            </span>

            <span
              className="sr-card-desc"
              style={{ marginTop: 3 }}
            >
              View your report submissions (0 reports)
            </span>
          </div>
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {selected && activeSetting && (
        <div
          className="sr-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelected(null);
            }
          }}
        >
          <div
            className="sr-modal"
            style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.14)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.28)'
            }}
          >
            <div className="sr-modal-head">
              <p className="sr-modal-title">
                {activeSetting.label}
              </p>

              <button
                className="sr-modal-close"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              {OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="sr-radio-card"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <input
                    type="radio"
                    name={selected}
                    value={option.value}
                    checked={privacy[selected] === option.value}
                    onChange={() =>
                      handleChange(selected, option.value)
                    }
                  />

                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacySafety;