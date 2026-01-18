import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessageContext } from '../context/MessageContext';
import { Home, Users, User, Bell, Book, MessageSquareText, Compass, BookOpen } from 'lucide-react';
import "../styles/ui.css";
import useMediaQuery from "../hooks/useMediaQuery";

const MenuItems = ({ setSidebarOpen }) => {
  const { user, unreadCount: unreadNotifications } = useAuth();
  const { unreadMessages, getTotalUnread } = useMessageContext();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const location = useLocation();
  const isMessageTab = location.pathname.startsWith('/messages');

  const [totalUnread, setTotalUnread] = useState(getTotalUnread() + unreadNotifications);

  useEffect(() => {
    setTotalUnread(getTotalUnread() + unreadNotifications);
  }, [unreadMessages, getTotalUnread, unreadNotifications]);

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

  return (
    <div className={`space-y-2 flex flex-col ${isMessageTab ? 'items-center' : ''}`}>
      {menuItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `relative flex items-center rounded-md transition-all duration-300 ease-in-out ${
              isMessageTab ? "w-10 h-10 justify-center" : "pl-3 py-[7px] gap-3 w-full"
            } ${
              isActive
                ? `custom-gradient text-[var(--text-accent-dark)] font-semibold ${!isMessageTab && "translate-x-3"}`
                : `hover:text-[var(--text-accent-dark)] ${!isMessageTab ? "hover:translate-x-3 gradient-hover" : ""}`
            }`
          }
          onClick={() => {
            if (typeof setSidebarOpen === "function" && isSmallScreen) {
              setSidebarOpen(false);
            }
          }}
        >
          <div className="relative flex items-center justify-center">
            <Icon className="w-5 h-5" />
            {(label === "Message" && getTotalUnread() > 0) && (
              <span className={`absolute bg-red-600 text-white text-[10px] font-bold px-1.5 py-[0.5px] rounded-full animate-pulse ${isMessageTab ? "-top-1 -right-1" : "-top-2 -right-0.5"}`}>
                {getTotalUnread()}
              </span>
            )}
            {(label === "Notification" && unreadNotifications > 0) && (
              <span className={`absolute bg-red-600 text-white text-[10px] font-bold px-1.5 py-[0.5px] rounded-full animate-pulse ${isMessageTab ? "-top-1 -right-1" : "-top-2 -right-0.5"}`}>
                {unreadNotifications}
              </span>
            )}
          </div>
          {!isMessageTab && <span className="truncate text-sm">{label}</span>}
</NavLink>
      ))}
    </div>
  );
};

export default MenuItems;