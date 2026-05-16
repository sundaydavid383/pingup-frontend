import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import axiosBase from '../../utils/axiosBase';

/* ─── Saved badge (uses sr-saved-badge CSS from Settings.jsx) ─── */
const Saved = () => (
  <span className="sr-saved-badge">
    <Check size={12} /> Saved
  </span>
);

/* ─── Radio group (uses sr-radio-card CSS from Settings.jsx) ─── */
const RadioGroup = ({ name, options, value, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="sr-stagger">
    {options.map((o) => (
      <label key={o.value} className="sr-radio-card">
        <input
          type="radio"
          name={name}
          value={o.value}
          checked={value === o.value}
          onChange={() => onChange(o.value)}
        />
        <span>{o.label}</span>
      </label>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────── */

const Appearance = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { currentTheme, setCurrentTheme } = useTheme();
  const [fontSize, setFontSize] = useState('medium');
  const [language, setLanguage] = useState('english');
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const isMounted = useRef(false);

  /* ── Load settings from backend on mount ── */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axiosBase.get('/api/settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success && res.data.settings) {
          const { themePreferences } = res.data.settings;
          if (themePreferences) {
            setFontSize(themePreferences.fontSize || 'medium');
            setLanguage(themePreferences.language || 'english');
            if (themePreferences.theme) {
              setCurrentTheme(themePreferences.theme);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch theme settings:', err);
      } finally {
        setInitialized(true);
      }
    };
    fetchSettings();
  }, [setCurrentTheme]);

  /* ── Auto-save to backend when settings change ── */
  const saveSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      await axiosBase.put('/api/settings/theme', {
        theme: currentTheme,
        fontSize,
        language,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save theme settings:', err);
    }
  }, [currentTheme, fontSize, language]);

  useEffect(() => {
    if (!initialized) return;
    if (!isMounted.current) { isMounted.current = true; return; }
    const timer = setTimeout(() => { saveSettings(); }, 500);
    return () => clearTimeout(timer);
  }, [currentTheme, fontSize, language, saveSettings, initialized]);

  /* ── Options ── */
  const themeOptions = [
    { label: 'Light',  value: 'light'  },
    { label: 'Dark',   value: 'dark'   },
    { label: 'System', value: 'system' },
  ];
  const fontSizeOptions = [
    { label: 'Small',       value: 'small'  },
    { label: 'Medium',      value: 'medium' },
    { label: 'Large',       value: 'large'  },
    { label: 'Extra Large', value: 'xlarge' },
  ];
  const languageOptions = [
    { label: 'English', value: 'english' },
    { label: 'Spanish', value: 'spanish' },
    { label: 'French',  value: 'french'  },
    { label: 'German',  value: 'german'  },
    { label: 'Chinese', value: 'chinese' },
  ];

  /* ── Render ── */
  return (
    <div>
      {/* Header — only when not embedded inside Settings.jsx */}
      {!isEmbedded && (
        <div className="max-w-2xl mx-auto p-4 md:p-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <button
              onClick={() => navigate(-1)}
              className="sr-back-btn"
              style={{ width: 40, height: 40 }}
            >
              <ArrowLeft size={17} style={{ color: 'var(--text-main)' }} />
            </button>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-.02em' }}>
              Appearance
            </h1>
            {saved && <Saved />}
          </div>
        </div>
      )}

      <div className={!isEmbedded ? 'max-w-2xl mx-auto p-4 md:p-6' : ''}>

        {/* Saved badge — when embedded the header is hidden so show it here */}
        {isEmbedded && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
            <p className="sr-section-heading" style={{ margin: 0 }}>Appearance</p>
            {saved && <Saved />}
          </div>
        )}

        {/* Theme */}
        <div className="sr-page">
          <p className="sr-section-heading" style={{ marginBottom: 10 }}>Theme</p>
          <RadioGroup
            name="theme"
            options={themeOptions}
            value={currentTheme}
            onChange={setCurrentTheme}
          />

          <div className="sr-divider" />

          {/* Font Size */}
          <p className="sr-section-heading" style={{ marginBottom: 10 }}>Font Size</p>
          <RadioGroup
            name="fontSize"
            options={fontSizeOptions}
            value={fontSize}
            onChange={setFontSize}
          />

          <div className="sr-divider" />

          {/* Language */}
          <p className="sr-section-heading" style={{ marginBottom: 10 }}>App Language</p>
          <RadioGroup
            name="language"
            options={languageOptions}
            value={language}
            onChange={setLanguage}
          />
        </div>

      </div>
    </div>
  );
};

export default Appearance;