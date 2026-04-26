import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Palette, Bell, FileText, Brain, HelpCircle, X } from 'lucide-react';
import AccountSettings from './AccountSettings';
import PrivacySafety from './PrivacySafety';
import Appearance from './Appearance';
import NotificationSettings from './NotificationSettings';
import PersonalInfo from './PersonalInfo';
import ContentPreferences from './ContentPreferences';
import HelpAbout from './HelpAbout';

const Settings = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('account');

  // Change category
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const settingsCategories = [
    {
      id: 'account',
      label: 'Account',
      icon: User,
      description: 'Password, email, security',
      component: AccountSettings
    },
    {
      id: 'privacy',
      label: 'Privacy & Safety',
      icon: Lock,
      description: 'Control who sees your content',
      component: PrivacySafety
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: Palette,
      description: 'Theme, font size, language',
      component: Appearance
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Alerts and preferences',
      component: NotificationSettings
    },
    {
      id: 'personal',
      label: 'Personal Info',
      icon: FileText,
      description: 'Birth date, gender, location',
      component: PersonalInfo
    },
    {
      id: 'content',
      label: 'Content Preferences',
      icon: Brain,
      description: 'Manage your interests',
      component: ContentPreferences
    },
    {
      id: 'help',
      label: 'Help & About',
      icon: HelpCircle,
      description: 'Support and info',
      component: HelpAbout
    }
  ];

  const activeItem = settingsCategories.find(cat => cat.id === activeCategory);
  const ActiveComponent = activeItem?.component;

  return (
    <div
      className="min-h-screen w-full max-w-7xl mx-auto flex flex-col lg:flex-row overflow-x-hidden"
      style={{ backgroundColor: 'var(--bg-main)' }}
    >
      {/* Header with back button (Mobile & Tablet) */}
      <div className="lg:hidden flex items-center justify-between p-3 sm:p-4 border-b sticky top-0 z-50" style={{ borderColor: 'var(--input-border)', backgroundColor: 'var(--bg-main)' }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg hover:opacity-70 transition"
          style={{ backgroundColor: 'var(--form-bg)' }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'white' }} />
        </button>
        <h1 className="text-lg sm:text-xl font-bold flex-1 ml-2" style={{ color: 'var(--text-main)' }}>
          Settings
        </h1>
      </div>

      {/* Horizontal Tab Bar for Mobile - Always Visible */}
      <div className="lg:hidden overflow-x-auto border-b sticky top-14 sm:top-16 z-40 scrollbar-hide" style={{ borderColor: 'var(--input-border)', backgroundColor: 'var(--bg-main)' }}>
        <div className="flex gap-1 sm:gap-2 md:gap-3 p-2 min-w-min">
          {settingsCategories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 md:px-4 py-2 rounded-lg whitespace-nowrap transition-all flex-shrink-0 text-xs sm:text-sm md:text-base font-medium ${isActive
                  ? 'custom-gradient text-white shadow-md'
                  : 'bg-white/5 text-gray-600 hover:bg-white/10'
                  }`}
                style={
                  isActive ? {} : { color: 'var(--text-main)', backgroundColor: 'var(--form-bg)' }
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'white' }} />
                <span className="hidden xs:inline sm:inline">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Left Sidebar - Categories (Desktop Only) */}
      <div
        className="hidden lg:flex lg:flex-col lg:static w-full lg:w-64 xl:w-72 2xl:w-80 lg:h-screen lg:border-r"
        style={{
          backgroundColor: 'var(--form-bg)',
          borderColor: 'var(--input-border)'
        }}
      >
        {/* Desktop Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b" style={{ borderColor: 'var(--input-border)' }}>
          <h1 className="text-xl lg:text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
            Settings
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:opacity-70 transition"
            style={{ backgroundColor: 'var(--bg-main)' }}
          >
            <X className="w-5 h-5" style={{ color: 'white' }} />
          </button>
        </div>

        {/* Categories List */}
        <div className="overflow-y-auto h-full lg:pb-6">
          <nav className="p-3 lg:p-4 space-y-2">
            {settingsCategories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`w-full px-4 lg:px-6 py-3 lg:py-4 rounded-lg transition-all duration-200 flex items-center gap-3 group ${isActive
                    ? 'custom-gradient text-white shadow-lg scale-[1.02]'
                    : 'hover:scale-[1.01]'
                    }`}
                  style={
                    !isActive
                      ? {
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--text-main)'
                      }
                      : {}
                  }
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} style={{ color: 'white' }} />
                  <div className="text-left min-w-0">
                    <div className={`font-medium text-base lg:text-lg ${isActive ? 'text-white' : ''}`}>
                      {category.label}
                    </div>
                    <div className={`text-sm lg:text-base mt-0.5 hidden lg:block ${isActive ? 'text-white/80' : 'opacity-60'}`}>
                      {category.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Header - Below Tab Bar */}
      <div className="lg:hidden mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-main)' }}>
          {activeItem?.label}
        </h2>
        <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {activeItem?.description}
        </p>
      </div>

      {/* Content Component */}
      <div className="flex-1 p-4 lg:p-6 xl:p-8 2xl:p-10">
        {ActiveComponent && (
          <div className="animate-fadeIn">
            <ActiveComponent isEmbedded={true} />
          </div>
        )}

        {/* Animation styles (scoped) */}
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Settings;
