import React, { createContext, useContext, useState, useEffect } from "react";
import axiosBase from "../utils/axiosBase";
import { useMessageContext } from "./MessageContext"; // 🟩 import MessageContext hook
import { useNotificationContext } from "./NotificationContext";
import assets from "../assets/assets";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("springsConnectUser");
    const returing = saved ? JSON.parse(saved) : null;
    console.log(returing);
    return returing
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [modalOpen, setModalOpen] = useState(false);
const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sponsors, setSponsors] = useState(null);


  const { resetUnread } = useMessageContext(); // 🟩 get resetUnread from MessageContext
const { 
  addNotification, 
  notifications, 
  markAllRead, 
  markAsRead, 
  unreadCount, 
  loadingNotifications, 
  setLoadingNotifications 
} = useNotificationContext();


const fetchNotifications = async () => {
  if (!user?._id || !token) return;

  try {
    setLoadingNotifications(true);

    const res = await axiosBase.get(
      `api/user/notifications?userId=${user._id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.success) {
      const notifs = res.data.notifications || [];
      notifs.forEach((n) => addNotification(n)); // Add to NotificationContext
      console.log(`🔔 Fetched ${notifs.length} notifications`);
    } else {
      console.warn("⚠️ Fetch failed — success was false.");
    }
  } catch (err) {
    console.error("❌ Failed to fetch notifications:", err);
  } finally {
    setLoadingNotifications(false);
  }
};

const handleRead = async (notificationId) => {
  if (!notificationId) return;

  // Mark as read locally in NotificationContext immediately
  markAsRead(notificationId);

  try {
    await axiosBase.get(
      `api/user/notifications/read?notificationId=${notificationId}&userId=${user?._id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Notification ${notificationId} marked as read on server`);
  } catch (err) {
    console.error("❌ Failed to mark notification as read:", err);
  }
};

// Run once on login or token load
useEffect(() => {
  if (user && token) fetchNotifications();
}, [user, token]);


  // 📌 Mark notification as read


  // 💾 Keep user & token in localStorage
  useEffect(() => {
    if (user && token) {
      localStorage.setItem("springsConnectUser", JSON.stringify(user));
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("springsConnectUser");
      localStorage.removeItem("token");
    }
  }, [user, token]);

  const login = (userData, token) => {
    setUser(userData);
    setToken(token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    //setUnreadCount(0);
    resetUnread(); // 🟩 clear unread messages on logout
  };

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        setSponsors(assets.advisite_brand);
      } catch (err) {
        console.error("❌ Sponsor error:", err.message);
      }
    };
    fetchSponsors();
  }, []);
return (
<AuthContext.Provider
  value={{
    user,
    token,
    login,
    logout,
    modalOpen,
    setModalOpen,
    sidebarOpen,
    setSidebarOpen,
    notifications,      // from NotificationContext
    unreadCount,                   // from NotificationContext
    loadingNotifications,          // from NotificationContext
    fetchNotifications,            // calls NotificationContext + server
    handleRead, 
    sponsors,
  }}
>
  {children}
</AuthContext.Provider>


);

};
