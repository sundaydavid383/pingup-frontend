import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from "react";
import axiosBase from "../utils/axiosBase";

const NotificationContext = createContext();

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

export const READ_ON_VIEW_CATEGORIES = new Set([
  NOTIFICATION_CATEGORIES.INBOX,
  NOTIFICATION_CATEGORIES.COMMENTS,
  NOTIFICATION_CATEGORIES.FOLLOWING,
  NOTIFICATION_CATEGORIES.PROFILE,
]);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  const [activeCategory, setActiveCategory] = useState(NOTIFICATION_CATEGORIES.INBOX);
  const pollingIntervalRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Deleted IDs persisted in localStorage so they survive refresh
  const [deletedNotificationIds, setDeletedNotificationIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('deletedNotifications') || '[]'));
    } catch {
      return new Set();
    }
  });

  // ─── Initial fetch — sets full state from backend ─────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (isFetchingRef.current) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    isFetchingRef.current = true;
    try {
      const res = await axiosBase.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });

     if (res.data.success && res.data.notifications) {
  const fresh = res.data.notifications.filter(
    n => !deletedNotificationIds.has(n._id)
  );
  setNotifications(prev => {
    const prevById = new Map(prev.map(n => [n._id, n]));
    return fresh.map(n => {
      const prior = prevById.get(n._id);
      // Never let a slightly-stale poll revert something we already marked read
      if (prior?.isRead && !n.isRead) return { ...n, isRead: true };
      return n;
    });
  });
  setLastFetched(new Date());
}
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoadingNotifications(false);
      isFetchingRef.current = false;
    }
  }, [deletedNotificationIds]);

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll every 60 seconds as a fallback (socket should cover real-time)
  useEffect(() => {
    pollingIntervalRef.current = setInterval(fetchNotifications, 60000);
    return () => clearInterval(pollingIntervalRef.current);
  }, [fetchNotifications]);

  // ─── Add a single new notification (called by socket handler) ────────────
  const addNotification = useCallback((notif) => {
    const notifId = notif._id || notif.id || notif.notificationId;

    if (notifId && deletedNotificationIds.has(notifId)) return;

    setNotifications(prev => {
      const exists = prev.some(n => (n._id || n.id) === notifId);
      if (exists) return prev;
      return [notif, ...prev];
    });
  }, [deletedNotificationIds]);

  // ─── Mark all as read ─────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    // Optimistic
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      const token = localStorage.getItem('token');
      await axiosBase.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('markAllRead error:', err);
    }
  }, []);

  // ─── Mark category as read ────────────────────────────────────────────────
  const markCategoryAsRead = useCallback(async (category) => {
    // Optimistic
    setNotifications(prev =>
      prev.map(n =>
        (n.category || NOTIFICATION_CATEGORIES.INBOX) === category
          ? { ...n, isRead: true }
          : n
      )
    );
    // Backend: mark each individually (no bulk category endpoint yet)
    try {
      const token = localStorage.getItem('token');
      const toMark = notifications.filter(
        n => (n.category || NOTIFICATION_CATEGORIES.INBOX) === category && !n.isRead
      );
      await Promise.allSettled(
        toMark.map(n =>
          axiosBase.put(`/api/notifications/${n._id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
    } catch (err) {
      console.error('markCategoryAsRead error:', err);
    }
  }, [notifications]);

  // ─── Mark one as read ─────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
    try {
      const token = localStorage.getItem('token');
      await axiosBase.put(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('markAsRead error:', err);
    }
  }, []);

  // ─── Delete one notification ──────────────────────────────────────────────
  const deleteNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n._id !== id));

    const newDeleted = new Set(deletedNotificationIds);
    newDeleted.add(id);
    setDeletedNotificationIds(newDeleted);
    localStorage.setItem('deletedNotifications', JSON.stringify([...newDeleted]));
  }, [deletedNotificationIds]);

  // ─── Delete all in category ───────────────────────────────────────────────
  const deleteCategoryNotifications = useCallback((category) => {
    setNotifications(prev => {
      const toDelete = prev.filter(
        n => (n.category || NOTIFICATION_CATEGORIES.INBOX) === category
      );
      const newDeleted = new Set(deletedNotificationIds);
      toDelete.forEach(n => newDeleted.add(n._id));
      setDeletedNotificationIds(newDeleted);
      localStorage.setItem('deletedNotifications', JSON.stringify([...newDeleted]));
      return prev.filter(
        n => (n.category || NOTIFICATION_CATEGORIES.INBOX) !== category
      );
    });
  }, [deletedNotificationIds]);

  // ─── Derived data ─────────────────────────────────────────────────────────
  const getNotificationsByCategory = useCallback((category) => {
    return notifications.filter(
      n => (n.category || NOTIFICATION_CATEGORIES.INBOX) === category
    );
  }, [notifications]);

  const notificationsByCategory = useMemo(() => {
    const grouped = {};
    Object.values(NOTIFICATION_CATEGORIES).forEach(cat => {
      grouped[cat] = getNotificationsByCategory(cat);
    });
    return grouped;
  }, [notifications, getNotificationsByCategory]);

  const activeNotifications = useMemo(
    () => getNotificationsByCategory(activeCategory),
    [activeCategory, getNotificationsByCategory]
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
        notifications,
        addNotification,
        markAllRead,
        markAsRead,
        deleteNotification,
        unreadCount,
        NOTIFICATION_CATEGORIES,
        CATEGORY_LABELS,
        activeCategory,
        setActiveCategory,
        activeNotifications,
        notificationsByCategory,
        getNotificationsByCategory,
        markCategoryAsRead,
        deleteCategoryNotifications,
        unreadCountByCategory,
        loadingNotifications,
        setLoadingNotifications,
        lastFetched,
        pollNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);