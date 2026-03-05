import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import axiosBase from '../../utils/axiosBase';

const Appearance = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { currentTheme, setCurrentTheme } = useTheme();
  const [fontSize, setFontSize] = useState('medium');
  const [language, setLanguage] = useState('english');
  const [saved, setSaved] = useState(false);

  // Load settings from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axiosBase.get('/api/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.settings) {
          const { themePreferences } = res.data.settings;
          if (themePreferences) {
            setFontSize(themePreferences.fontSize || 'medium');
            setLanguage(themePreferences.language || 'english');
            // Theme is handled by ThemeContext
            if (themePreferences.theme) {
              setCurrentTheme(themePreferences.theme);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch theme settings:', err);
      }
    };
    fetchSettings();
  }, [setCurrentTheme]);

  const saveSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      await axiosBase.put('/api/settings/theme', {
        theme: currentTheme,
        fontSize,
        language
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save theme settings:', err);
    }
  }, [currentTheme, fontSize, language]);

  // Auto-save when settings change
  useEffect(() => {
    const timer = setTimeout(() => {
      saveSettings();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentTheme, fontSize, language, saveSettings]);

  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
  };

  const handleFontSizeChange = (newFontSize) => {
    setFontSize(newFontSize);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };

  const themeOptions = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' }
  ];

  const fontSizeOptions = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
    { label: 'Extra Large', value: 'xlarge' }
  ];

  const languageOptions = [
    { label: 'English', value: 'english' },
    { label: 'Spanish', value: 'spanish' },
    { label: 'French', value: 'french' },
    { label: 'German', value: 'german' },
    { label: 'Chinese', value: 'chinese' }
  ];

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
              Appearance
            </h1>
            {saved && (
              <span className="text-green-500 text-sm ml-auto">Saved!</span>
            )}
          </div>
        </div>
      )}
      <div className={!isEmbedded ? 'max-w-2xl mx-auto p-4 md:p-6' : ''}>
        {/* Theme Settings */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-main)' }}>
            Theme
          </h2>
          <div className="space-y-3">
            {themeOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition hover:opacity-80"
                style={{
                  backgroundColor: 'var(--form-bg)',
                  border: '1px solid var(--input-border)'
                }}
              >
                <input
                  type="radio"
                  name="theme"
                  value={option.value}
                  checked={currentTheme === option.value}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className="w-5 h-5"
                />
                <span style={{ color: 'var(--text-main)' }}>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Font Size Settings */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-main)' }}>
            Font Size
          </h2>
          <div className="space-y-3">
            {fontSizeOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition hover:opacity-80"
                style={{
                  backgroundColor: 'var(--form-bg)',
                  border: '1px solid var(--input-border)'
                }}
              >
                <input
                  type="radio"
                  name="fontSize"
                  value={option.value}
                  checked={fontSize === option.value}
                  onChange={(e) => handleFontSizeChange(e.target.value)}
                  className="w-5 h-5"
                />
                <span style={{ color: 'var(--text-main)' }} className={`text-${option.value}`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Language Settings */}
        <div>
          <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-main)' }}>
            App Language
          </h2>
          <div className="space-y-3">
            {languageOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition hover:opacity-80"
                style={{
                  backgroundColor: 'var(--form-bg)',
                  border: '1px solid var(--input-border)'
                }}
              >
                <input
                  type="radio"
                  name="language"
                  value={option.value}
                  checked={language === option.value}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-5 h-5"
                />
                <span style={{ color: 'var(--text-main)' }}>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Appearance;
