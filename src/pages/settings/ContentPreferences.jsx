import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';

const ContentPreferences = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({
    interests: {
      spirituality: true,
      technology: false,
      sports: false,
      entertainment: true,
      news: true,
      health: false,
      education: true,
      business: false
    },
    contentType: {
      posts: true,
      stories: true,
      videos: true,
      articles: true,
      events: false
    }
  });

  const togglePreference = (category, key) => {
    setPreferences({
      ...preferences,
      [category]: {
        ...preferences[category],
        [key]: !preferences[category][key]
      }
    });
  };

  const handleSave = () => {
    console.log('Saving preferences:', preferences);
    alert('Content preferences updated successfully');
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
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-main)' }}>
              Content Preferences
            </h1>
          </div>
        </div>
      )}
      <div className={!isEmbedded ? 'max-w-2xl mx-auto p-4 md:p-6' : ''}>
        {/* Interests */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-main)' }}>
            Your Interests
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(preferences.interests).map(([key, value]) => (
              <button
                key={key}
                onClick={() => togglePreference('interests', key)}
                className={`p-4 rounded-lg font-medium transition text-center capitalize ${
                  value
                    ? 'custom-gradient text-white'
                    : 'border'
                }`}
                style={
                  !value
                    ? {
                        backgroundColor: 'var(--form-bg)',
                        borderColor: 'var(--input-border)',
                        color: 'var(--text-main)'
                      }
                    : {}
                }
              >
                <div className="flex items-center justify-center gap-2">
                  {value && <Check className="w-4 h-4" />}
                  <span>{key}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Types */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-main)' }}>
            Content Types to Show
          </h2>
          <div className="space-y-3">
            {Object.entries(preferences.contentType).map(([key, value]) => (
              <label
                key={key}
                className="flex items-center gap-3 p-4 rounded-lg cursor-pointer hover:opacity-80 transition capitalize"
                style={{
                  backgroundColor: 'var(--form-bg)',
                  border: '1px solid var(--input-border)'
                }}
              >
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => togglePreference('contentType', key)}
                  className="w-5 h-5 cursor-pointer"
                />
                <span style={{ color: 'var(--text-main)' }}>{key}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 rounded-lg custom-gradient text-white font-semibold hover:opacity-90 transition"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};

export default ContentPreferences;
