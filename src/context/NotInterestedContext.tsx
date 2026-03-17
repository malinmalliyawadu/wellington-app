import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getNotInterestedItemIds, markNotInterested, removeNotInterested } from '../services/notInterested';
import type { NotInterestedItemType } from '../types/database';

interface NotInterestedContextType {
  isNotInterested: (type: NotInterestedItemType, id: string) => boolean;
  toggleNotInterested: (type: NotInterestedItemType, id: string) => void;
  getNotInterestedIds: (type: NotInterestedItemType) => string[];
}

const NotInterestedContext = createContext<NotInterestedContextType | undefined>(undefined);

export function NotInterestedProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const currentUserId = session?.user?.id;
  const [notInterestedEvents, setNotInterestedEvents] = useState<string[]>([]);
  const [notInterestedPlaces, setNotInterestedPlaces] = useState<string[]>([]);

  const refreshFromServer = useCallback(() => {
    if (!currentUserId) return;
    getNotInterestedItemIds(currentUserId)
      .then(({ events, places }) => {
        setNotInterestedEvents(events);
        setNotInterestedPlaces(places);
      })
      .catch((e) => console.warn('Failed to load not interested items:', e));
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      setNotInterestedEvents([]);
      setNotInterestedPlaces([]);
      return;
    }
    refreshFromServer();
  }, [currentUserId, refreshFromServer]);

  // Refresh when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshFromServer();
    });
    return () => sub.remove();
  }, [refreshFromServer]);

  const getSetterForType = (type: NotInterestedItemType) => {
    return type === 'event' ? setNotInterestedEvents : setNotInterestedPlaces;
  };

  const getStateForType = useCallback(
    (type: NotInterestedItemType) => {
      return type === 'event' ? notInterestedEvents : notInterestedPlaces;
    },
    [notInterestedEvents, notInterestedPlaces]
  );

  const isNotInterested = useCallback(
    (type: NotInterestedItemType, id: string) => getStateForType(type).includes(id),
    [getStateForType]
  );

  const toggleNotInterested = useCallback(
    (type: NotInterestedItemType, id: string) => {
      if (!currentUserId) return;

      const setter = getSetterForType(type);

      setter((prev) => {
        const alreadyHidden = prev.includes(id);

        const apiCall = alreadyHidden
          ? removeNotInterested(currentUserId, type, id)
          : markNotInterested(currentUserId, type, id);

        apiCall.then(() => {
          showToast({
            message: alreadyHidden ? 'Removed from hidden' : 'Hidden from your view',
          });
        }).catch(() => {
          // Revert on error
          setter((current) =>
            alreadyHidden
              ? [...current, id]
              : current.filter((itemId) => itemId !== id)
          );
        });

        return alreadyHidden
          ? prev.filter((itemId) => itemId !== id)
          : [...prev, id];
      });
    },
    [currentUserId, showToast]
  );

  const getNotInterestedIds = useCallback(
    (type: NotInterestedItemType) => getStateForType(type),
    [getStateForType]
  );

  return (
    <NotInterestedContext.Provider value={{ isNotInterested, toggleNotInterested, getNotInterestedIds }}>
      {children}
    </NotInterestedContext.Provider>
  );
}

export function useNotInterested() {
  const context = useContext(NotInterestedContext);
  if (!context) {
    throw new Error('useNotInterested must be used within a NotInterestedProvider');
  }
  return context;
}
