import { createContext, useContext, useState, useCallback } from "react";
import axiosBase from "../utils/axiosBase";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Load deleted notifications from localStorage on mount
  const [deletedNotificationIds, setDeletedNotificationIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('deletedNotifications') || '[]'));
    } catch {
      return new Set();
    }
  });

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

  // Compute unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAllRead,
        markAsRead,
        deleteNotification,
        unreadCount,
        loadingNotifications,
        setLoadingNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);
