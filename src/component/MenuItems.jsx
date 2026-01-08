import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessageContext } from '../context/MessageContext';
import { Home, Users, User, Bell, Book, MessageSquareText, Compass, BookOpen } from 'lucide-react';
import "../styles/ui.css";
import useMediaQuery from "../hooks/useMediaQuery";

const MenuItems = ({ setSidebarOpen }) => {
  const { user, unreadCount: unreadNotifications } = useAuth(); // 🔹 get notification unread count
  const { unreadMessages, getTotalUnread } = useMessageContext();
     const activeWidth = 658;

  // ✅ Compute total unread for messages + notifications
  const [totalUnread, setTotalUnread] = useState(getTotalUnread() + unreadNotifications);

  useEffect(() => {
    setTotalUnread(getTotalUnread() + unreadNotifications);
  }, [unreadMessages, getTotalUnread, unreadNotifications]);


const menuItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/messages", label: "Message", icon: MessageSquareText, showBadge: true },
  { to: "/connections", label: "Connections", icon: Users },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: `/profile/${user?._id}`, label: "Profile", icon: User },
  { to: "/notification", label: "Notification", icon: Bell },
  { to: "/scriptures", label: "Scriptures", icon: BookOpen },
  { to: "/bible", label: "Bible", icon: Book },  // ← new Bible menu item
];


  return (
    <div className="px-3 space-y-0.5 font-medium text-[var(--text-light)]">
      {menuItems.map(({ to, label, icon: Icon, showBadge }) => (
  <NavLink
      key={to}
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `relative pl-3 py-[7px] flex items-center gap-2 rounded-md text-sm transition-transform duration-500 ease-in-out ${
          isActive
            ? "translate-x-3 custom-gradient text-[var(--text-accent-dark)] font-semibold"
            : "hover:translate-x-3 gradient-hover hover:text-[var(--text-accent-dark)] hover:shadow-sm"
        }`
      }
      onClick={() => {
        // only close on small screens
        if (typeof setSidebarOpen === "function" && window.innerWidth < activeWidth) {
          setSidebarOpen(false);
        }
      }}
    >
    <div className="relative">
      <Icon className="w-4 h-4" />

      {label === "Message" && getTotalUnread() > 0 && (
        <span className="absolute -top-2 -right-0.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-[1px] rounded-full shadow-md animate-pulse">
          {getTotalUnread()}
        </span>
      )}

      {label === "Notification" && unreadNotifications > 0 && (
        <span className="absolute -top-2 -right-0.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-[1px] rounded-full shadow-md animate-pulse">
          {unreadNotifications}
        </span>
      )}
    </div>
    <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default MenuItems;
