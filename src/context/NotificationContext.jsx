import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from "react";
import axiosBase from "../utils/axiosBase";

const NotificationContext = createContext();

// Category configuration
const NOTIFICATION_CATEGORIES = {
  INBOX: 'inbox',
  COMMENTS: 'comments',
  FOLLOWING: 'following',
  CALLS: 'calls',
  PROFILE: 'profile',
  MESSAGES: 'messages'
};

const CATEGORY_LABELS = {
  inbox: 'Inbox',
  comments: 'Comments',
  following: 'Following',
  calls: 'Calls',
  profile: 'Profile',
  messages: 'Messages'
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [activeCategory, setActiveCategory] = useState(NOTIFICATION_CATEGORIES.INBOX);
  const pollingIntervalRef = useRef(null);

  // Load deleted notifications from localStorage on mount
  const [deletedNotificationIds, setDeletedNotificationIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('deletedNotifications') || '[]'));
    } catch {
      return new Set();
    }
  });

  // Poll for new notifications (fallback for when WebSocket fails)
  const pollNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axiosBase.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success && res.data.notifications) {
        const newNotifications = res.data.notifications;
        setNotifications(prev => {
          // Merge new notifications with existing ones, avoiding duplicates
          const existingIds = new Set(prev.map(n => n._id));
          const trulyNew = newNotifications.filter(n => !existingIds.has(n._id));
          if (trulyNew.length > 0) {
            return [...trulyNew, ...prev];
          }
          return prev;
        });
        setLastFetched(new Date());
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, []);

  // Start polling when component mounts (fallback mechanism)
  useEffect(() => {
    // Poll immediately
    pollNotifications();
    
    // Then poll every 30 seconds as fallback
    pollingIntervalRef.current = setInterval(pollNotifications, 30000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [pollNotifications]);

  // Add new notification (filter out duplicates and deleted ones)
  const addNotification = useCallback((notif) => {
    const notifId = notif._id || notif.id || notif.notificationId;
    
    // Skip if already deleted
    if (notifId && deletedNotificationIds.has(notifId)) {
      console.log('Skipping deleted notification:', notifId);
      return;
    }

    // Skip if already in state (prevent duplicates)
    setNotifications(prev => {
      const exists = prev.some(n => (n._id || n.id) === notifId);
      if (exists) {
        console.log('Skipping duplicate notification:', notifId);
        return prev;
      }
      return [notif, ...prev];
    });
  }, [deletedNotificationIds]);

  // Mark all as read - syncs with backend
  const markAllRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      await axiosBase.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // Still update local state even if API fails
      setNotifications(prev =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    }
  }, []);

  // Mark all in category as read
  const markCategoryAsRead = useCallback(async (category) => {
    try {
      const token = localStorage.getItem('token');
      
      // Optimistic update
      setNotifications(prev =>
        prev.map((n) => (n.category === category || (!n.category && category === NOTIFICATION_CATEGORIES.INBOX) ? { ...n, isRead: true } : n))
      );

      // Backend sync for all notifications in the category
      const categoryNotifications = notifications.filter(n => (n.category || NOTIFICATION_CATEGORIES.INBOX) === category);
      await Promise.all(
        categoryNotifications.map(n =>
          axiosBase.put(`/api/notifications/${n._id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
    } catch (err) {
      console.error(`Failed to mark ${category} notifications as read:`, err);
    }
  }, [notifications]);

  // Mark one as read - syncs with backend
  const markAsRead = useCallback(async (id) => {
    // First update local state immediately for responsive UI
    setNotifications(prev =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    
    // Then sync with backend
    try {
      const token = localStorage.getItem('token');
      await axiosBase.put(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Delete notification and persist the deletion
  const deleteNotification = useCallback((id) => {
    // Remove from state
    setNotifications((prev) => prev.filter(n => n._id !== id));
    
    // Add to deleted set and persist
    const newDeleted = new Set(deletedNotificationIds);
    newDeleted.add(id);
    setDeletedNotificationIds(newDeleted);
    localStorage.setItem('deletedNotifications', JSON.stringify([...newDeleted]));
  }, [deletedNotificationIds]);

  // Delete all in category
  const deleteCategoryNotifications = useCallback((category) => {
    setNotifications(prev => {
      const toDelete = prev.filter(n => (n.category || NOTIFICATION_CATEGORIES.INBOX) === category);
      const remaining = prev.filter(n => (n.category || NOTIFICATION_CATEGORIES.INBOX) !== category);
      
      // Add all deleted IDs to localStorage
      const newDeleted = new Set(deletedNotificationIds);
      toDelete.forEach(n => newDeleted.add(n._id));
      setDeletedNotificationIds(newDeleted);
      localStorage.setItem('deletedNotifications', JSON.stringify([...newDeleted]));
      
      return remaining;
    });
  }, [deletedNotificationIds]);

  // Get notifications filtered by category
  const getNotificationsByCategory = useCallback((category) => {
    return notifications.filter(n => (n.category || NOTIFICATION_CATEGORIES.INBOX) === category);
  }, [notifications]);

  // Get notifications grouped by category
  const notificationsByCategory = useMemo(() => {
    const grouped = {};
    Object.values(NOTIFICATION_CATEGORIES).forEach(cat => {
      grouped[cat] = getNotificationsByCategory(cat);
    });
    return grouped;
  }, [notifications, getNotificationsByCategory]);

  // Get active category notifications
  const activeNotifications = useMemo(() => {
    return getNotificationsByCategory(activeCategory);
  }, [activeCategory, getNotificationsByCategory]);

  // Compute unread count (total)
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Compute unread count by category
  const unreadCountByCategory = useMemo(() => {
    const counts = {};
    Object.values(NOTIFICATION_CATEGORIES).forEach(cat => {
      counts[cat] = notificationsByCategory[cat].filter(n => !n.isRead).length;
    });
    return counts;
  }, [notificationsByCategory]);

  return (
    <NotificationContext.Provider
      value={{
        // All notifications
        notifications,
        addNotification,
        markAllRead,
        markAsRead,
        deleteNotification,
        unreadCount,
        
        // Category management
        NOTIFICATION_CATEGORIES,
        CATEGORY_LABELS,
        activeCategory,
        setActiveCategory,
        
        // Category-specific operations
        activeNotifications,
        notificationsByCategory,
        getNotificationsByCategory,
        markCategoryAsRead,
        deleteCategoryNotifications,
        unreadCountByCategory,
        
        // Loading and fetch state
        loadingNotifications,
        setLoadingNotifications,
        lastFetched,
        pollNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);
