import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Users, User, Bell, MessageSquareText, Compass, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useMessageSeen } from "../../../MessageSeenContext";
import { useNotificationContext } from "../../context/NotificationContext";
import "./mobilenavbar.css"; // CSS file
import BackButton from "./BackButton";

const MobileNavbar = ({ setSidebarOpen, supportOpen }) => {
  const { user } = useAuth();
  const { totalUnreadCount } = useMessageSeen();
  const { unreadCount: notificationUnreadCount } = useNotificationContext();

  const menuItems = [
    { to: "/", icon: Home },
    { to: "/messages", icon: MessageSquareText, badge: totalUnreadCount },
    { to: "/discover", icon: Compass },
    { to: "/connections", icon: Users },
    { to: `/profile/${user?._id}`, icon: User },
    { to: "/notification", icon: Bell, badge: notificationUnreadCount },
  ];

  return (
    <div className={`mobile-navbar${supportOpen ? ' is-hidden' : ''}`}>
      {/* Sidebar Toggle */}
  {/* <BackButton className="bg-white text-blue-600 hover:bg-blue-600 hover:text-white" top="5px" left="49px"  onClick={() => setSidebarOpen(true)} /> */}

      {/* Menu Icons */}
      <div className="mobile-navbar-menu">
        {menuItems.map(({ to, icon: Icon, badge }) => (
          <NavLink key={to} to={to} className="mobile-navbar-link">
            <Icon className="mobile-navbar-icon" />
            {badge > 0 && <span className="mobile-navbar-badge">{badge}</span>}
          </NavLink>
        ))}
        
      </div>
    </div>
  );
};

export default MobileNavbar;
