import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getFollowingIds, followUser, unfollowUser } from '../services/follows';

interface FollowContextType {
  followingIds: string[];
  isFollowing: (userId: string) => boolean;
  toggleFollow: (userId: string) => void;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUserId) {
      setFollowingIds([]);
      return;
    }

    getFollowingIds(currentUserId)
      .then(setFollowingIds)
      .catch(() => {});
  }, [currentUserId]);

  const isFollowing = useCallback(
    (userId: string) => followingIds.includes(userId),
    [followingIds]
  );

  const toggleFollow = useCallback((userId: string) => {
    if (!currentUserId) return;

    setFollowingIds((prev) => {
      const alreadyFollowing = prev.includes(userId);
      // Optimistic update
      const next = alreadyFollowing
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];

      // Fire and forget the API call, revert on error
      const apiCall = alreadyFollowing
        ? unfollowUser(currentUserId, userId)
        : followUser(currentUserId, userId);

      apiCall.catch(() => {
        // Revert on error
        setFollowingIds((current) =>
          alreadyFollowing
            ? [...current, userId]
            : current.filter((id) => id !== userId)
        );
      });

      return next;
    });
  }, [currentUserId]);

  return (
    <FollowContext.Provider value={{ followingIds, isFollowing, toggleFollow }}>
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
}
