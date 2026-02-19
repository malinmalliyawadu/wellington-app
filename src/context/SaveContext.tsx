import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getSavedItemIds, saveItem, unsaveItem } from '../services/saves';
import type { SavedItemType } from '../types/database';

interface SaveContextType {
  isSaved: (type: SavedItemType, id: string) => boolean;
  toggleSave: (type: SavedItemType, id: string) => void;
  getSavedIds: (type: SavedItemType) => string[];
}

const SaveContext = createContext<SaveContextType | undefined>(undefined);

export function SaveProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<string[]>([]);
  const [savedEvents, setSavedEvents] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUserId) {
      setSavedPosts([]);
      setSavedPlaces([]);
      setSavedEvents([]);
      return;
    }

    getSavedItemIds(currentUserId)
      .then(({ posts, places, events }) => {
        setSavedPosts(posts);
        setSavedPlaces(places);
        setSavedEvents(events);
      })
      .catch(() => {});
  }, [currentUserId]);

  const getSetterForType = (type: SavedItemType) => {
    if (type === 'post') return setSavedPosts;
    if (type === 'place') return setSavedPlaces;
    return setSavedEvents;
  };

  const getStateForType = useCallback(
    (type: SavedItemType) => {
      if (type === 'post') return savedPosts;
      if (type === 'place') return savedPlaces;
      return savedEvents;
    },
    [savedPosts, savedPlaces, savedEvents]
  );

  const isSaved = useCallback(
    (type: SavedItemType, id: string) => getStateForType(type).includes(id),
    [getStateForType]
  );

  const toggleSave = useCallback(
    (type: SavedItemType, id: string) => {
      if (!currentUserId) return;

      const setter = getSetterForType(type);

      setter((prev) => {
        const alreadySaved = prev.includes(id);

        const apiCall = alreadySaved
          ? unsaveItem(currentUserId, type, id)
          : saveItem(currentUserId, type, id);

        apiCall.catch(() => {
          // Revert on error
          setter((current) =>
            alreadySaved
              ? [...current, id]
              : current.filter((itemId) => itemId !== id)
          );
        });

        return alreadySaved
          ? prev.filter((itemId) => itemId !== id)
          : [...prev, id];
      });
    },
    [currentUserId]
  );

  const getSavedIds = useCallback(
    (type: SavedItemType) => getStateForType(type),
    [getStateForType]
  );

  return (
    <SaveContext.Provider value={{ isSaved, toggleSave, getSavedIds }}>
      {children}
    </SaveContext.Provider>
  );
}

export function useSave() {
  const context = useContext(SaveContext);
  if (!context) {
    throw new Error('useSave must be used within a SaveProvider');
  }
  return context;
}
