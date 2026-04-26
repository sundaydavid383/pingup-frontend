import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axiosBase from '../../utils/axiosBase';

const NotificationSettings = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    messageAlerts: true,
    commentAlerts: true,
    emailNotifications: false,
    muteAll: false
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const isMounted = useRef(false);

  // Load settings from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axiosBase.get('/api/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.settings) {
          const { notificationSettings } = res.data.settings;
          const push = notificationSettings?.push ?? true;
          const mentions = notificationSettings?.mentions ?? true;
          const phone = notificationSettings?.phone ?? true;
          const email = notificationSettings?.email ?? false;
          const allMuted = !push && !mentions && !phone && !email;

          setNotifications({
            pushNotifications: push,
            messageAlerts: mentions,
            commentAlerts: phone,
            emailNotifications: email,
            muteAll: allMuted
          });
        }
      } catch (err) {
        console.error('Failed to fetch notification settings:', err);
      } finally {
        setInitialized(true);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = useCallback(async () => {
    setLoading(true);
    setSaved(false);
    try {
      const token = localStorage.getItem('token');
      await axiosBase.put('/api/settings/notifications', {
        push: notifications.pushNotifications,
        mentions: notifications.messageAlerts,
        phone: notifications.commentAlerts,
        email: notifications.emailNotifications
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save notification settings:', err);
    } finally {
      setLoading(false);
    }
  }, [notifications]);

  // Auto-save when settings change
  useEffect(() => {
    if (!initialized) {
      return;
    }
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    const timer = setTimeout(() => {
      saveSettings();
    }, 500);

    return () => clearTimeout(timer);
  }, [notifications, saveSettings, initialized]);

  const toggleNotification = (id) => {
    if (id === 'muteAll') {
      const nextMuteAll = !notifications.muteAll;
      setNotifications({
        pushNotifications: !nextMuteAll,
        messageAlerts: !nextMuteAll,
        commentAlerts: !nextMuteAll,
        emailNotifications: !nextMuteAll,
        muteAll: nextMuteAll
      });
      return;
    }

    const nextState = {
      ...notifications,
      [id]: !notifications[id],
      muteAll: false
    };

    if (!nextState.pushNotifications && !nextState.messageAlerts && !nextState.commentAlerts && !nextState.emailNotifications) {
      nextState.muteAll = true;
    }

    setNotifications(nextState);
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
              Notifications
            </h1>
            {saved && (
              <span className="text-green-500 text-sm ml-auto">Saved!</span>
            )}
          </div>
        </div>
      )}
      <div className={!isEmbedded ? 'max-w-2xl mx-auto p-4 md:p-6' : ''}>
        {/* Notification Settings */}
        <div className="space-y-3">
          {notificationItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-lg flex items-center justify-between"
              style={{
                backgroundColor: 'var(--form-bg)',
                border: '1px solid var(--input-border)'
              }}
            >
              <div>
                <p className="font-medium" style={{ color: 'var(--text-main)' }}>
                  {item.label}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {item.description}
                </p>
              </div>
              <button
                onClick={() => toggleNotification(item.id)}
                className={`relative w-12 h-7 rounded-full transition-all ${notifications[item.id] ? 'custom-gradient' : 'bg-gray-300'
                  }`}
                disabled={loading}
              >
                <div
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${notifications[item.id] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Additional Settings */}
        <div className="mt-12">
          <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-main)' }}>
            Do Not Disturb
          </h2>
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--form-bg)',
              border: '1px solid var(--input-border)'
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-main)' }}>
                  Enable Do Not Disturb
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-main)' }}>
                  Until
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const notificationItems = [
  {
    id: 'pushNotifications',
    label: 'Push Notifications',
    description: 'Receive push notifications on your device'
  },
  {
    id: 'messageAlerts',
    label: 'Message Alerts',
    description: 'Get notified when you receive messages'
  },
  {
    id: 'commentAlerts',
    label: 'Comment Alerts',
    description: 'Get notified when someone comments on your posts'
  },
  {
    id: 'emailNotifications',
    label: 'Email Notifications',
    description: 'Receive email notifications for important events'
  },
  {
    id: 'muteAll',
    label: 'Mute All',
    description: 'Silence all notifications temporarily'
  }
];

export default NotificationSettings;
