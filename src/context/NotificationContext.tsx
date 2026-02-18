import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import {
  getNotifications as fetchNotifications,
  getUnreadCount as fetchUnreadCount,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
  deleteAllNotifications as deleteAllService,
  type Notification,
} from '../services/notifications';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteAll: () => void;
  refetch: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadNotifications = useCallback((): Promise<void> => {
    if (!currentUserId) return Promise.resolve();
    return Promise.all([
      fetchNotifications(currentUserId),
      fetchUnreadCount(currentUserId),
    ])
      .then(([notifs, count]) => {
        setNotifications(notifs);
        setUnreadCount(count);
      })
      .catch(() => {});
  }, [currentUserId]);

  // Initial load
  useEffect(() => {
    if (!currentUserId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    loadNotifications();
  }, [currentUserId, loadNotifications]);

  // Poll every 30 seconds for unread count
  useEffect(() => {
    if (!currentUserId) return;

    intervalRef.current = setInterval(() => {
      if (AppState.currentState === 'active') {
        fetchUnreadCount(currentUserId)
          .then(setUnreadCount)
          .catch(() => {});
      }
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentUserId]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    markAsReadService(notificationId).catch(() => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    if (!currentUserId) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const previousCount = unreadCount;
    setUnreadCount(0);

    markAllAsReadService(currentUserId).catch(() => {
      setUnreadCount(previousCount);
      loadNotifications();
    });
  }, [currentUserId, unreadCount, loadNotifications]);

  const deleteAll = useCallback(() => {
    if (!currentUserId) return;

    const previousNotifications = notifications;
    const previousCount = unreadCount;
    setNotifications([]);
    setUnreadCount(0);

    deleteAllService(currentUserId).catch(() => {
      setNotifications(previousNotifications);
      setUnreadCount(previousCount);
    });
  }, [currentUserId, notifications, unreadCount]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, deleteAll, refetch: loadNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
