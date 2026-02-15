import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Palette, Bell, FileText, Brain, HelpCircle, Menu, X } from 'lucide-react';
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when category changes on mobile
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    if (window.innerWidth < 768) {
      setMobileSidebarOpen(false);
    }
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
      className="min-h-screen flex flex-col md:flex-row gap-0 md:gap-0"
      style={{ backgroundColor: 'var(--bg-main)' }}
    >
      {/* Header with back button (Mobile & Tablet) */}
      <div className="md:hidden flex items-center justify-between p-3 sm:p-4 border-b sticky top-0 z-50" style={{ borderColor: 'var(--input-border)', backgroundColor: 'var(--bg-main)' }}>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg hover:opacity-70 transition"
            style={{ backgroundColor: 'var(--form-bg)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
            Settings
          </h1>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg hover:opacity-70 transition"
          style={{ backgroundColor: 'var(--form-bg)' }}
        >
          {mobileSidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Left Sidebar - Categories */}
      <div
        className={`fixed md:static inset-x-0 top-14 md:top-0 z-40 md:z-auto w-full md:w-64 lg:w-72 h-[calc(100vh-56px)] md:h-screen md:border-r transition-all duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--form-bg)',
          borderColor: 'var(--input-border)'
        }}
      >
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between p-4 lg:p-6 border-b" style={{ borderColor: 'var(--input-border)' }}>
          <h1 className="text-xl lg:text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
            Settings
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:opacity-70 transition"
            style={{ backgroundColor: 'var(--bg-main)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories List */}
        <div className="overflow-y-auto h-full md:pb-6">
          <nav className="p-3 md:p-4 space-y-2">
            {settingsCategories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 flex items-center gap-3 group ${
                    isActive
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
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
                  <div className="text-left min-w-0">
                    <div className={`font-medium text-sm sm:text-base ${isActive ? 'text-white' : ''}`}>
                      {category.label}
                    </div>
                    <div className={`text-xs mt-0.5 hidden sm:block ${isActive ? 'text-white/80' : 'opacity-60'}`}>
                      {category.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Right Panel - Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-screen p-4 sm:p-6 md:p-8 lg:max-w-4xl">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center gap-3 mb-6 lg:mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-main)' }}>
                {activeItem?.label}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {activeItem?.description}
              </p>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
              {activeItem?.label}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {activeItem?.description}
            </p>
          </div>

          {/* Content Component */}
          {ActiveComponent && (
            <div className="animate-fadeIn">
              <ActiveComponent isEmbedded={true} />
            </div>
          )}
        </div>
      </div>

      {/* Animation */}
      <style jsx>{`
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
  );
};

export default Settings;
