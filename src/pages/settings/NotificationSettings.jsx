import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff } from 'lucide-react';
import axiosBase from '../../utils/axiosBase';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const NOTIFICATION_ITEMS = [
  { id: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications on your device' },
  { id: 'messageAlerts',     label: 'Message Alerts',     desc: 'Get notified when you receive messages' },
  { id: 'commentAlerts',     label: 'Comment Alerts',     desc: 'Get notified when someone comments on your posts' },
  { id: 'emailNotifications',label: 'Email Notifications',desc: 'Receive email notifications for important events' },
  { id: 'muteAll',           label: 'Mute All',           desc: 'Silence all notifications temporarily' },
];

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

const Saved = () => <span className="text-green-500 text-sm">Saved!</span>;

const NotificationSettings = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { isSupported, permission, isSubscribed, requestPermissionAndSubscribe, unsubscribe } =
    usePushNotifications();

  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    messageAlerts: true,
    commentAlerts: true,
    emailNotifications: false,
    muteAll: false,
  });

  // DND state
  const [dndEnabled, setDndEnabled] = useState(false);
  const [dndFrom, setDndFrom] = useState("");
  const [dndUntil, setDndUntil] = useState("");

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dndSaved, setDndSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const isMounted = useRef(false);

  // Load settings from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch notification toggles
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

        // Fetch DND settings
        const dndRes = await axiosBase.get('/api/notifications/settings/dnd', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (dndRes.data.success) {
          setDndEnabled(dndRes.data.dndEnabled || false);
          setDndFrom(dndRes.data.dndFrom || "22:00");
          setDndUntil(dndRes.data.dndUntil || "08:00");
        }
      } catch (err) {
        console.error('Failed to fetch notification settings:', err);
      } finally {
        setInitialized(true);
      }
    };
    fetchSettings();
  }, []);

  // Save toggle settings
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

  // Auto-save 500ms after any toggle change
  useEffect(() => {
    if (!initialized) return;
    if (!isMounted.current) { isMounted.current = true; return; }
    const timer = setTimeout(() => saveSettings(), 500);
    return () => clearTimeout(timer);
  }, [notifications, saveSettings, initialized]);

  // Save DND settings
  const saveDnd = useCallback(async (enabled, from, until) => {
    try {
      const token = localStorage.getItem('token');
      await axiosBase.put(
        '/api/notifications/settings/dnd',
        { dndEnabled: enabled, dndFrom: from, dndUntil: until },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDndSaved(true);
      setTimeout(() => setDndSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save DND settings:', err);
    }
  }, []);

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

  // Handle push permission button
  const handlePushToggle = async () => {
    setPushLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        const result = await requestPermissionAndSubscribe();
        if (!result.success && result.reason === "denied") {
          alert("Notification permission was denied. Please enable it in your browser settings.");
        }
      }
    } finally {
      setPushLoading(false);
    }
  };

  const pushButtonLabel = () => {
    if (pushLoading) return "Please wait...";
    if (!isSupported) return "Not supported in this browser";
    if (permission === "denied") return "Blocked by browser — enable in settings";
    if (isSubscribed) return "Disable Push Notifications";
    return "Enable Push Notifications";
  };

  const content = (
    <>
      {/* ── Toggle list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}
        className={isEmbedded ? "sr-stagger" : ""}>
        {NOTIFICATION_ITEMS.map((item) => (
          <div key={item.id} className={isEmbedded ? "sr-card" : "bg-white rounded-xl p-4 shadow-sm mb-2"}>
            <div className={isEmbedded ? "sr-card-row" : "flex items-center justify-between"}>
              <div className={isEmbedded ? "sr-card-text" : "flex flex-col"}>
                <span className={isEmbedded ? "sr-card-label" : "font-medium text-gray-800"}>
                  {item.label}
                </span>
                <span className={isEmbedded ? "sr-card-desc" : "text-sm text-gray-500"}>
                  {item.desc}
                </span>
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

      {/* ── Push notification permission button ── */}
      {isSupported && (
        <div className={isEmbedded ? "sr-card mb-6" : "bg-white rounded-xl p-4 shadow-sm mb-6"}>
          <p className={isEmbedded ? "sr-section-heading" : "font-semibold text-gray-800 mb-2"}>
            Browser Push Notifications
          </p>
          <p className="text-sm text-gray-500 mb-3">
            {isSubscribed
              ? "You are currently receiving push notifications on this device."
              : "Allow this app to send you push notifications even when the tab is closed."}
          </p>
          <button
            onClick={handlePushToggle}
            disabled={pushLoading || permission === "denied" || !isSupported}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
              ${isSubscribed
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100"}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubscribed ? <BellOff size={16} /> : <Bell size={16} />}
            {pushButtonLabel()}
          </button>
          {permission === "denied" && (
            <p className="text-xs text-red-500 mt-2">
              Notifications are blocked. Go to your browser settings → Site permissions → Notifications and allow this site.
            </p>
          )}
        </div>
      )}

      {/* ── Do Not Disturb ── */}
      <p className={isEmbedded ? "sr-section-heading" : "font-semibold text-gray-800 mb-3"}>
        Do Not Disturb
        {dndSaved && <span className="text-green-500 text-sm ml-3">Saved!</span>}
      </p>
      <div className={isEmbedded ? "sr-card" : "bg-white rounded-xl p-4 shadow-sm"}>
        {/* DND master toggle */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-gray-800 text-sm">Enable Do Not Disturb</p>
            <p className="text-xs text-gray-500">Silence notifications during set hours</p>
          </div>
          <Toggle
            on={dndEnabled}
            onToggle={() => {
              const next = !dndEnabled;
              setDndEnabled(next);
              saveDnd(next, dndFrom, dndUntil);
            }}
            disabled={false}
          />
        </div>

        {/* Time range — only shown when DND is enabled */}
        {dndEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className={isEmbedded ? "sr-label" : "block text-sm text-gray-600 mb-1"}>
                From
              </label>
              <input
                type="time"
                value={dndUntil}
                placeholder="Not set"
                onChange={(e) => setDndUntil(e.target.value)}
                onBlur={() => saveDnd(dndEnabled, dndFrom, dndUntil)}
                className={isEmbedded ? "sr-input" : "border rounded-lg px-3 py-2 text-sm w-full"}
              />
            </div>
            <div>
              <label className={isEmbedded ? "sr-label" : "block text-sm text-gray-600 mb-1"}>
                Until
              </label>
              <input
                type="time"
                value={dndUntil}
                onChange={(e) => setDndUntil(e.target.value)}
                onBlur={() => saveDnd(dndEnabled, dndFrom, dndUntil)}
                className={isEmbedded ? "sr-input" : "border rounded-lg px-3 py-2 text-sm w-full"}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (isEmbedded) {
    return (
      <div className="sr-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
          <p className="sr-section-heading" style={{ margin: 0 }}>Notifications</p>
          {saved && <Saved />}
        </div>
        {content}
      </div>
    );
  }

  return (
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
      {content}
    </div>
  );
};

export default NotificationSettings;