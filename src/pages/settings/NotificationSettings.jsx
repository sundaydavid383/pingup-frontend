import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axiosBase from '../../utils/axiosBase';

const NOTIFICATION_ITEMS = [
  { id: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications on your device' },
  { id: 'messageAlerts',     label: 'Message Alerts',     desc: 'Get notified when you receive messages' },
  { id: 'commentAlerts',     label: 'Comment Alerts',     desc: 'Get notified when someone comments on your posts' },
  { id: 'emailNotifications',label: 'Email Notifications',desc: 'Receive email notifications for important events' },
  { id: 'muteAll',           label: 'Mute All',           desc: 'Silence all notifications temporarily' },
];

/* ── Reusable Toggle switch ── */
const Toggle = ({ on, onToggle, disabled }) => (
  <button
    onClick={onToggle}
    disabled={disabled}
    className={`relative w-12 h-7 rounded-full transition-all ${on ? 'custom-gradient' : 'bg-gray-300'}`}
  >
    <div
      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
        on ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

/* ── "Saved!" badge ── */
const Saved = () => (
  <span className="text-green-500 text-sm">Saved!</span>
);

const NotificationSettings = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    messageAlerts: true,
    commentAlerts: true,
    emailNotifications: false,
    muteAll: false,
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
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success && res.data.settings) {
          const { notificationSettings } = res.data.settings;
          const push     = notificationSettings?.push     ?? true;
          const mentions = notificationSettings?.mentions ?? true;
          const phone    = notificationSettings?.phone    ?? true;
          const email    = notificationSettings?.email    ?? false;
          const allMuted = !push && !mentions && !phone && !email;

          setNotifications({
            pushNotifications:  push,
            messageAlerts:      mentions,
            commentAlerts:      phone,
            emailNotifications: email,
            muteAll:            allMuted,
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
      await axiosBase.put(
        '/api/settings/notifications',
        {
          push:     notifications.pushNotifications,
          mentions: notifications.messageAlerts,
          phone:    notifications.commentAlerts,
          email:    notifications.emailNotifications,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save notification settings:', err);
    } finally {
      setLoading(false);
    }
  }, [notifications]);

  // Auto-save 500 ms after any change
  useEffect(() => {
    if (!initialized) return;
    if (!isMounted.current) { isMounted.current = true; return; }
    const timer = setTimeout(() => saveSettings(), 500);
    return () => clearTimeout(timer);
  }, [notifications, saveSettings, initialized]);

  const toggleNotification = (id) => {
    if (id === 'muteAll') {
      const next = !notifications.muteAll;
      setNotifications({
        pushNotifications:  !next,
        messageAlerts:      !next,
        commentAlerts:      !next,
        emailNotifications: !next,
        muteAll:            next,
      });
      return;
    }
    const nextState = { ...notifications, [id]: !notifications[id], muteAll: false };
    if (
      !nextState.pushNotifications &&
      !nextState.messageAlerts &&
      !nextState.commentAlerts &&
      !nextState.emailNotifications
    ) {
      nextState.muteAll = true;
    }
    setNotifications(nextState);
  };

  return (
    <div>
      {!isEmbedded && (
        <div className="max-w-2xl mx-auto p-4 md:p-6">
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
            {saved && <span className="text-green-500 text-sm ml-auto">Saved!</span>}
          </div>
        </div>
      )}

      <div className={!isEmbedded ? 'max-w-2xl mx-auto p-4 md:p-6' : 'sr-page'}>
        {/* Heading row with inline Saved badge for embedded mode */}
        {isEmbedded && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
            <p className="sr-section-heading" style={{ margin: 0 }}>Notifications</p>
            {saved && <Saved />}
          </div>
        )}

        {/* Toggle list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }} className="sr-stagger">
          {NOTIFICATION_ITEMS.map((item) => (
            <div key={item.id} className="sr-card">
              <div className="sr-card-row">
                <div className="sr-card-text">
                  <span className="sr-card-label">{item.label}</span>
                  <span className="sr-card-desc">{item.desc}</span>
                </div>
                <Toggle
                  on={notifications[item.id]}
                  onToggle={() => toggleNotification(item.id)}
                  disabled={loading}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Do Not Disturb */}
        <p className="sr-section-heading">Do Not Disturb</p>
        <div className="sr-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="sr-label">From</label>
              <input type="time" className="sr-input" />
            </div>
            <div>
              <label className="sr-label">Until</label>
              <input type="time" className="sr-input" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;