import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { notificationService } from '../services/notification.service';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const { socket } = useSocket() || {};

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data.notifications || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;
    const handler = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      toast(notification.message, {
        icon: '🔔',
        style: {
          background: '#18181B',
          color: '#FAFAFA',
          border: '1px solid #3F3F46',
        },
      });
    };
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socket]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = async (id) => {
    await notificationService.delete(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
