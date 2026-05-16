import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, X, User, Lock, Palette, Bell, FileText, Brain,
  HelpCircle, Eye, EyeOff, Check, ChevronRight, Calendar,
  MapPin, ExternalLink
} from 'lucide-react';
import AccountSettings from './AccountSettings';
import PrivacySafety from './PrivacySafety';
import Appearance from './Appearance';
import NotificationSettings from './NotificationSettings';
import PersonalInfo from './PersonalInfo';
import ContentPreferences from './ContentPreferences';
import HelpAbout from './HelpAbout';
import "../../styles/settings.css"
// import { useAuth } from '../../context/AuthContext';
// import { useTheme } from '../../context/ThemeContext';
// import axiosBase from '../../utils/axiosBase';
// import toast from 'react-hot-toast';
// import { APP_NAME } from '../../constants/appConfig';



/* ─────────────────────────────────────────────────────────────────────────────
   HELPER COMPONENTS
   ─────────────────────────────────────────────────────────────────────────── */
const Input = ({ label, type = 'text', value, onChange, placeholder, required, rightIcon }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label className="sr-label">{label}</label>}
    <div className="sr-input-wrap">
      <input
        className={`sr-input${rightIcon ? ' sr-input-has-icon' : ''}`}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
      {rightIcon}
    </div>
  </div>
);

const Toggle = ({ on, onToggle, disabled }) => (
  <button
    type="button"
    className={`sr-toggle-track${on ? ' sr-toggle-on custom-gradient' : ''}`}
    onClick={onToggle}
    disabled={disabled}
  >
    <div className="sr-toggle-thumb" />
  </button>
);

const SkeletonList = ({ n = 3 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="sr-skeleton" style={{ animationDelay: `${i * .1}s` }} />
    ))}
  </div>
);

const Saved = () => (
  <span className="sr-saved-badge">
    <Check size={12} /> Saved
  </span>
);

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-PAGES
   ─────────────────────────────────────────────────────────────────────────── */













/* ─────────────────────────────────────────────────────────────────────────────
   CATEGORIES CONFIG
   ─────────────────────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'account',       label: 'Account',      shortLabel: 'Account',   icon: User,        description: 'Password, email, security',      component: AccountSettings      },
  { id: 'privacy',       label: 'Privacy',      shortLabel: 'Privacy',   icon: Lock,        description: 'Control who sees your content',  component: PrivacySafety        },
  { id: 'appearance',    label: 'Appearance',   shortLabel: 'Look',      icon: Palette,     description: 'Theme, font size, language',     component: Appearance           },
  { id: 'notifications', label: 'Alerts',       shortLabel: 'Alerts',    icon: Bell,        description: 'Alerts and preferences',         component: NotificationSettings },
  { id: 'personal',      label: 'Personal',     shortLabel: 'Personal',  icon: FileText,    description: 'Birth date, gender, location',   component: PersonalInfo         },
  { id: 'content',       label: 'Content',      shortLabel: 'Content',   icon: Brain,       description: 'Manage your interests',          component: ContentPreferences   },
  { id: 'help',          label: 'Help',         shortLabel: 'Help',      icon: HelpCircle,  description: 'Support and info',               component: HelpAbout            },
];

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN SETTINGS COMPONENT
   ─────────────────────────────────────────────────────────────────────────── */
const Settings = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState('account');

  const activeItem = CATEGORIES.find(c => c.id === active);
  const ActiveComponent = activeItem?.component;

  return (
    <>

      <div className="sr">
        {/* ── Desktop Sidebar ── */}
        <aside className="sr-sidebar">
          <div className="sr-sidebar-head">
            <h1 className="sr-sidebar-title">Settings</h1>
            <button className="sr-close-btn" onClick={() => navigate(-1)}>
              <X size={14} />
            </button>
          </div>
          <nav className="sr-sidebar-nav">
            <span className="sr-nav-section-label">Preferences</span>
            {CATEGORIES.map(({ id, label, icon: Icon, description }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className={`sr-nav-btn${isActive ? ' sr-nav-active custom-gradient' : ''}`}
                >
                  <span className="sr-nav-icon">
                    <Icon size={14} style={{ color: isActive ? '#fff' : 'var(--text-secondary)' }} />
                  </span>
                  <span className="sr-nav-text">
                    <span className="sr-nav-label">{label}</span>
                    <span className="sr-nav-desc">{description}</span>
                  </span>
                  <span className="sr-nav-dot" />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Right column ── */}
        <div className="sr-right">

          {/* Mobile top bar */}
          <div className="sr-mob-header">
            <button className="sr-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
            </button>
            <h1 className="sr-mob-title">Settings</h1>
          </div>

          {/* Pill tab bar */}
          <div className="sr-tab-bar">
            {CATEGORIES.map(({ id, label, shortLabel, icon: Icon }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className={`sr-tab${isActive ? ' sr-tab-active custom-gradient' : ''}`}
                >
                  <Icon />
                  <span className="sr-tab-label">{label}</span>
                  <span className="sr-tab-shortlabel">{shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile section label */}
          <div className="sr-mob-section">
            <p className="sr-mob-section-title">{activeItem?.label}</p>
            <p className="sr-mob-section-desc">{activeItem?.description}</p>
          </div>

          {/* Content */}
          <div className="sr-content">
            {ActiveComponent && (
              <div key={active}>
                <ActiveComponent />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;