import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Appearance = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState('medium');
  const [language, setLanguage] = useState('english');

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

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
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
              Appearance
            </h1>
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
                  checked={theme === option.value}
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
                  onChange={(e) => setFontSize(e.target.value)}
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
                  onChange={(e) => setLanguage(e.target.value)}
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

export default Appearance;
