import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessageSeen } from '../../MessageSeenContext';
import { Home, Users, User, Bell, Book, MessageSquareText, Compass, BookOpen, Settings, LogOut, HelpCircle  } from 'lucide-react';
import "../styles/ui.css";
import "../styles/sidebar-award.css"; // ← ADD THIS
import useMediaQuery from "../hooks/useMediaQuery";
import { useSupportChat } from '../context/SupportChatContext';
import { useSidebarTooltip } from "./shared/SidebarTooltipPortal";

const MenuItems = ({ setSidebarOpen }) => {
  const { user, unreadCount: unreadNotifications, logout } = useAuth();
  const { totalUnreadCount } = useMessageSeen();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const location = useLocation();
  const navigate = useNavigate();
  const { showTooltip, hideTooltip } = useSidebarTooltip();
  const { setSupportOpen } = useSupportChat();

  const isMessageTab   = location.pathname.startsWith('/messages');
  const isSettingsTab  = location.pathname.startsWith('/settings');
  const isDiscoveriesTab = location.pathname.startsWith('/discover');
  const isProfileTab   = location.pathname.startsWith('/profile') || location.pathname === '/profile';
  const isCollapsed = isMessageTab || isSettingsTab || isDiscoveriesTab || isProfileTab;

  const menuItems = [
    { to: "/",                     label: "Home",         icon: Home },
    { to: "/messages",             label: "Messages",     icon: MessageSquareText },
    { to: "/connections",          label: "Connections",  icon: Users },
    { to: "/discover",             label: "Discover",     icon: Compass },
    { to: `/profile/${user?._id}`, label: "Profile",      icon: User },
    { to: "/notification",         label: "Notifications",icon: Bell },
    { to: "/scriptures",           label: "Scriptures",   icon: BookOpen },
    { to: "/bible",                label: "Bible",        icon: Book },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const handleMouseEnter = (e, label) => {
    if (isCollapsed && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      showTooltip(label, rect.right + 8, rect.top + rect.height / 2);
    }
  };

  // Stagger delay helpers
  const delays = ['sb-delay-1','sb-delay-2','sb-delay-3','sb-delay-4',
                  'sb-delay-5','sb-delay-6','sb-delay-7','sb-delay-8'];

  return (
    <div className={`space-y-0.5 flex flex-col w-full ${isCollapsed ? 'items-center' : ''}`}>

      {/* ── Section label (full mode only) ── */}
      {!isCollapsed && <div className="sb-section-label">Main</div>}

      {menuItems.map(({ to, label, icon: Icon }, idx) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) => [
            'nav-item',
            delays[idx] || '',
            isCollapsed ? 'collapsed' : '',
            isActive ? 'active' : '',
          ].join(' ')}
          onClick={() => {
            if (typeof setSidebarOpen === "function" && isSmallScreen) {
              setSidebarOpen(false);
            }
          }}
          onMouseEnter={(e) => handleMouseEnter(e, label)}
          onMouseLeave={hideTooltip}
        >
          {/* Icon */}
          <div className="nav-icon">
            <Icon />
            {/* Dot badge for collapsed mode */}
            {label === "Messages" && totalUnreadCount > 0 && isCollapsed && (
              <span className="sb-badge-dot" />
            )}
            {label === "Notifications" && unreadNotifications > 0 && isCollapsed && (
              <span className="sb-badge-dot" />
            )}
          </div>

          {/* Label + pill badge (full mode) */}
          {!isCollapsed && (
            <>
              <span className="nav-label">{label}</span>
              {label === "Messages" && totalUnreadCount > 0 && (
                <span className="sb-badge">
                  {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                </span>
              )}
              {label === "Notifications" && unreadNotifications > 0 && (
                <span className="sb-badge">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
      <button
        onClick={() => setSupportOpen(true)}
        className={['nav-item sb-delay-8', isCollapsed ? 'collapsed' : ''].join(' ')}
        style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%' }}
        onMouseEnter={(e) => handleMouseEnter(e, "Support")}
        onMouseLeave={hideTooltip}
      >
        <div className="nav-icon"><HelpCircle /></div>
        {!isCollapsed && <span className="nav-label">Support</span>}
      </button>
      {/* Section sep + label */}
      <hr className="sb-section-sep" />
      {!isCollapsed && <div className="sb-section-label">Account</div>}

      {/* Settings */}
      <NavLink
        to="/settings"
        className={({ isActive }) => [
          'nav-item sb-delay-9',
          isCollapsed ? 'collapsed' : '',
          isActive ? 'active' : '',
        ].join(' ')}
        onClick={() => {
          if (typeof setSidebarOpen === "function" && isSmallScreen) setSidebarOpen(false);
        }}
        onMouseEnter={(e) => handleMouseEnter(e, "Settings")}
        onMouseLeave={hideTooltip}
      >
        <div className="nav-icon"><Settings /></div>
        {!isCollapsed && <span className="nav-label">Settings</span>}
      </NavLink>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className={[
          'nav-item sb-delay-10',
          isCollapsed ? 'collapsed' : '',
        ].join(' ')}
        style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%' }}
        onMouseEnter={(e) => {
          handleMouseEnter(e, "Logout");
          e.currentTarget.style.color = '#f87171';
        }}
        onMouseLeave={(e) => {
          hideTooltip();
          e.currentTarget.style.color = '';
        }}
      >
        <div className="nav-icon"><LogOut /></div>
        {!isCollapsed && <span className="nav-label">Logout</span>}
      </button>
    </div>
  );
};

export default MenuItems;