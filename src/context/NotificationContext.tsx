import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import {
  getNotifications as fetchNotifications,
  getUnreadCount as fetchUnreadCount,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
  deleteAllNotifications as deleteAllService,
  mapRow,
  type Notification,
} from '../services/notifications';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteAll: () => void;
  refetch: () => Promise<void>;
  onNewNotificationRef: React.MutableRefObject<((notification: Notification) => void) | null>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const onNewNotificationRef = useRef<((notification: Notification) => void) | null>(null);

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
      .catch((e) => console.warn('Failed to load notifications:', e));
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

  // Supabase Realtime subscription
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`notifications:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newNotification = mapRow(payload.new);
          setNotifications((prev) => [newNotification, ...prev]);
          if (!newNotification.read) {
            setUnreadCount((prev) => prev + 1);
          }
          // Fire callback for in-app banner
          onNewNotificationRef.current?.(newNotification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const deletedId = (payload.old as any).id;
          setNotifications((prev) => {
            const removed = prev.find((n) => n.id === deletedId);
            if (removed && !removed.read) {
              setUnreadCount((c) => Math.max(0, c - 1));
            }
            return prev.filter((n) => n.id !== deletedId);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Reconciliation refetch when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && currentUserId) {
        loadNotifications();
      }
    });
    return () => subscription.remove();
  }, [currentUserId, loadNotifications]);

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
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteAll,
        refetch: loadNotifications,
        onNewNotificationRef,
      }}
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
