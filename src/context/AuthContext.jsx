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
    const returning = saved ? JSON.parse(saved) : null;
    console.log("🔄 [AuthContext] Initializing from localStorage:", {
      hasUser: !!returning,
      userId: returning?._id,
      username: returning?.username,
      onboardingCompleted: returning?.onboardingCompleted
    });
    return returning;
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem("token");
    console.log("🔑 [AuthContext] Token from localStorage:", savedToken ? "EXISTS" : "MISSING");
    return savedToken || null;
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sponsors, setSponsors] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  

 const { resetUnread, unreadMessages } = useMessageContext();
 const { 
  addNotification, 
  notifications, 
  markAllRead, 
  markAsRead, 
  unreadCount, 
  loadingNotifications, 
  setLoadingNotifications 
} = useNotificationContext();


const messageUnreadCount = Object.values(unreadMessages).reduce(
  (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 
  0
);
const totalUnreadCount = unreadCount + messageUnreadCount;


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

  // Mark as read locally in NotificationContext immediately (this now syncs with backend)
  await markAsRead(notificationId);

  console.log(`✅ Notification ${notificationId} marked as read`);
};

// Run once on login or token load
useEffect(() => {
  if (user && token) fetchNotifications();
}, [user, token]);


  // 📌 Mark notification as read


  // 💾 Keep user & token in localStorage
  useEffect(() => {
    if (user && token) {
      console.log("💾 [AuthContext] Persisting user to localStorage:", {
        userId: user._id,
        username: user.username,
        onboardingCompleted: user.onboardingCompleted
      });
      localStorage.setItem("springsConnectUser", JSON.stringify(user));
      localStorage.setItem("token", token);
    } else {
      console.log("🗑️  [AuthContext] Clearing localStorage (logout)");
      localStorage.removeItem("springsConnectUser");
      localStorage.removeItem("token");
    }
  }, [user, token]);

  const login = (userData, token, options = {}) => {
    console.log("🔐 [AuthContext] Login called with userData:", {
      id: userData?._id,
      name: userData?.name,
      onboardingCompleted: userData?.onboardingCompleted
    });
    
    setUser(userData);
    setToken(token);

    const needsPasswordSetup = options.needsPasswordSetup === true || userData?.password === null;
    setShowPasswordModal(needsPasswordSetup);

    // Check if user needs onboarding (explicitly check if NOT true)
    // This handles undefined, null, and false cases correctly
    const needsOnboarding = userData?.onboardingCompleted !== true;
    console.log("📋 [AuthContext] Onboarding check - needsOnboarding:", needsOnboarding, "value was:", userData?.onboardingCompleted);
    
    if (needsOnboarding) {
      console.log("🎯 [AuthContext] Showing onboarding modal");
      setShowOnboarding(true);
    } else {
      console.log("✅ [AuthContext] User already completed onboarding");
      setShowOnboarding(false);
    }
  };

  const updateUser = (newData) => {
    setUser(newData);
  };

  const logout = () => {
    console.log("🚪 [AuthContext] Logout initiated");
    setUser(null);
    setToken(null);
    setShowPasswordModal(false);
    setShowOnboarding(false);
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
        setUser,
        token,
        login,
        updateUser,
        logout,
        modalOpen,
        setModalOpen,
        sidebarOpen,
        setSidebarOpen,
        showPasswordModal,
        setShowPasswordModal,
        showOnboarding,
        setShowOnboarding,
        notifications,
        unreadCount: totalUnreadCount,
        loadingNotifications,
        fetchNotifications,
        handleRead,
        sponsors,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
