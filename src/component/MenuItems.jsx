import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessageSeen } from '../../MessageSeenContext';
import { Home, Users, User, Bell, Book, MessageSquareText, Compass, BookOpen, Settings, LogOut } from 'lucide-react';
import "../styles/ui.css";
import useMediaQuery from "../hooks/useMediaQuery";
import { useSidebarTooltip } from "./shared/SidebarTooltipPortal";

const MenuItems = ({ setSidebarOpen }) => {
  const { user, unreadCount: unreadNotifications, logout } = useAuth();
  const { totalUnreadCount } = useMessageSeen();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const location = useLocation();
  const navigate = useNavigate();
  const { showTooltip, hideTooltip } = useSidebarTooltip();
  
  const isMessageTab = location.pathname.startsWith('/messages');
  const isSettingsTab = location.pathname.startsWith('/settings');
  const isDiscoveriesTab = location.pathname.startsWith('/discover');
  const isProfileTab = location.pathname.startsWith('/profile') || location.pathname === '/profile';
  
  // Combined condition for collapsed sidebar
  const isCollapsed = isMessageTab || isSettingsTab || isDiscoveriesTab || isProfileTab;

  const menuItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/messages", label: "Message", icon: MessageSquareText },
    { to: "/connections", label: "Connections", icon: Users },
    { to: "/discover", label: "Discover", icon: Compass },
    { to: `/profile/${user?._id}`, label: "Profile", icon: User },
    { to: "/notification", label: "Notification", icon: Bell },
    { to: "/scriptures", label: "Scriptures", icon: BookOpen },
    { to: "/bible", label: "Bible", icon: Book },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  // Handle mouse enter for tooltip
  const handleMouseEnter = (e, label) => {
    if (isCollapsed && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      showTooltip(label, rect.right, rect.top + rect.height / 2);
    }
  };

  // Handle mouse leave to hide tooltip
  const handleMouseLeave = () => {
    hideTooltip();
  };

  return (
    <div className={`space-y-1 flex flex-col ${isCollapsed ? 'items-center' : ''}`}>
      {menuItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `relative flex items-center rounded-md transition-all duration-300 ease-in-out ${isCollapsed ? "w-10 h-10 justify-center group" : "pl-3 py-[7px] gap-3 w-full"
            } ${isActive
              ? `custom-gradient text-[var(--text-accent-dark)] font-semibold ${!isCollapsed && "translate-x-3"}`
              : `hover:text-[var(--text-accent-dark)] ${!isCollapsed ? "hover:translate-x-3 gradient-hover" : ""}`
            }`
          }
          onClick={() => {
            if (typeof setSidebarOpen === "function" && isSmallScreen) {
              setSidebarOpen(false);
            }
          }}
          onMouseEnter={(e) => handleMouseEnter(e, label)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative flex items-center justify-center">
            <Icon className="w-5 h-5" />
            {(label === "Message" && totalUnreadCount > 0) && (
              <span className={`absolute bg-red-600 text-white text-[10px] font-bold px-1.5 py-[0.5px] rounded-full animate-pulse ${isCollapsed ? "-top-1 -right-1" : "-top-2 -right-0.5"}`}>
                {totalUnreadCount}
              </span>
            )}
            {(label === "Notification" && unreadNotifications > 0) && (
              <span className={`absolute bg-red-600 text-white text-[10px] font-bold px-1.5 py-[0.5px] rounded-full animate-pulse ${isCollapsed ? "-top-1 -right-1" : "-top-2 -right-0.5"}`}>
                {unreadNotifications}
              </span>
            )}
          </div>
          {!isCollapsed && <span className="truncate text-sm">{label}</span>}
        </NavLink>
      ))}

      {/* Separator */}
      {!isCollapsed && <hr className="my-2 border-[var(--input-border)]" />}

      {/* Settings */}
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `relative flex items-center rounded-md transition-all duration-300 ease-in-out ${isCollapsed ? "w-10 h-10 justify-center group" : "pl-3 py-[7px] gap-3 w-full"
          } ${isActive
            ? `custom-gradient text-[var(--text-accent-dark)] font-semibold ${!isCollapsed && "translate-x-3"}`
            : `hover:text-[var(--text-accent-dark)] ${!isCollapsed ? "hover:translate-x-3 gradient-hover" : ""}`
          }`
        }
        onClick={() => {
          if (typeof setSidebarOpen === "function" && isSmallScreen) {
            setSidebarOpen(false);
          }
        }}
        onMouseEnter={(e) => handleMouseEnter(e, "Settings")}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </div>
        {!isCollapsed && <span className="truncate text-sm">Settings</span>}
      </NavLink>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className={`relative flex items-center rounded-md transition-all duration-300 ease-in-out hover:text-red-600 group ${isCollapsed ? "w-10 h-10 justify-center" : "pl-3 py-[7px] gap-3 w-full"
          } ${!isCollapsed ? "hover:translate-x-3 gradient-hover" : ""}`}
        onMouseEnter={(e) => handleMouseEnter(e, "Logout")}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative flex items-center justify-center">
          <LogOut className="w-5 h-5" />
        </div>
        {!isCollapsed && <span className="truncate text-sm">Logout</span>}
      </button>
    </div>
  );
};

export default MenuItems;
