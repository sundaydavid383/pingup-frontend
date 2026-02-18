import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotificationSettings = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    messageAlerts: true,
    commentAlerts: true,
    emailNotifications: false,
    muteAll: false
  });

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

  const toggleNotification = (id) => {
    setNotifications({
      ...notifications,
      [id]: !notifications[id]
    });
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
export default NotificationSettings;
