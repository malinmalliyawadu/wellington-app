import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { getFollowingIds, followUser, unfollowUser } from '../services/follows';
import { createFollowNotification, deleteNotificationForFollow } from '../services/notifications';
import { awardPoints } from '../services/points';
import { posthog } from '../config/posthog';

interface FollowContextType {
  followingIds: string[];
  isFollowing: (userId: string) => boolean;
  toggleFollow: (userId: string) => void;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const currentUserId = session?.user?.id;
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  const refreshFromServer = useCallback(() => {
    if (!currentUserId) return;
    getFollowingIds(currentUserId)
      .then(setFollowingIds)
      .catch((e) => console.warn('Failed to load following IDs:', e));
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      setFollowingIds([]);
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

      posthog.capture("user_followed", {
        following: !alreadyFollowing,
        followed_user_id: userId,
      });

      // Fire and forget the API call, revert on error
      const apiCall = alreadyFollowing
        ? unfollowUser(currentUserId, userId)
        : followUser(currentUserId, userId);

      apiCall
        .then(() => {
          // Invalidate related caches
          queryClient.invalidateQueries({ queryKey: ['q', 'feed'] });
          queryClient.invalidateQueries({ queryKey: ['q', ['follow-counts']] });
          queryClient.invalidateQueries({ queryKey: ['q', ['followers']] });
          queryClient.invalidateQueries({ queryKey: ['q', ['following']] });

          if (alreadyFollowing) {
            deleteNotificationForFollow(currentUserId, userId).catch(() => {});
          } else {
            createFollowNotification(currentUserId, userId).catch(() => {});
            awardPoints(currentUserId, 'follow', userId).catch(() => {});
          }
        })
        .catch(() => {
          // Revert on error
          setFollowingIds((current) =>
            alreadyFollowing
              ? [...current, userId]
              : current.filter((id) => id !== userId)
          );
        });

      return next;
    });
  }, [currentUserId, queryClient]);

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
