import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { getLikedPostIds, likePost, unlikePost, getAllLikeCounts } from '../services/likes';
import { createLikeNotification, deleteNotificationForLike } from '../services/notifications';

interface LikeStateContextType {
  isLiked: (postId: string) => boolean;
  getLikeCount: (postId: string) => number;
}

interface LikeActionsContextType {
  toggleLike: (postId: string) => void;
}

const LikeStateContext = createContext<LikeStateContextType | undefined>(undefined);
const LikeActionsContext = createContext<LikeActionsContextType | undefined>(undefined);

export function LikeProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const currentUserId = session?.user?.id;
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const refreshFromServer = useCallback(() => {
    if (!currentUserId) return;
    getLikedPostIds(currentUserId)
      .then(setLikedPostIds)
      .catch(() => {});
    getAllLikeCounts()
      .then(setLikeCounts)
      .catch(() => {});
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      setLikedPostIds([]);
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

  const isLiked = useCallback(
    (postId: string) => likedPostIds.includes(postId),
    [likedPostIds]
  );

  const getLikeCount = useCallback(
    (postId: string) => likeCounts[postId] ?? 0,
    [likeCounts]
  );

  const toggleLike = useCallback((postId: string) => {
    if (!currentUserId) return;

    setLikedPostIds((prev) => {
      const alreadyLiked = prev.includes(postId);

      // Optimistic update on counts
      setLikeCounts((counts) => ({
        ...counts,
        [postId]: (counts[postId] ?? 0) + (alreadyLiked ? -1 : 1),
      }));

      const apiCall = alreadyLiked
        ? unlikePost(currentUserId, postId)
        : likePost(currentUserId, postId);

      apiCall.then(() => {
        queryClient.invalidateQueries({ queryKey: ['q', ['likes', postId]] });

        if (alreadyLiked) {
          deleteNotificationForLike(currentUserId, postId).catch(() => {});
        } else {
          createLikeNotification(currentUserId, postId).catch((e) => console.error('like notification failed:', e));
        }
      }).catch(() => {
        // Revert on error
        setLikedPostIds((current) =>
          alreadyLiked
            ? [...current, postId]
            : current.filter((id) => id !== postId)
        );
        setLikeCounts((counts) => ({
          ...counts,
          [postId]: (counts[postId] ?? 0) + (alreadyLiked ? 1 : -1),
        }));
      });

      return alreadyLiked
        ? prev.filter((id) => id !== postId)
        : [...prev, postId];
    });
  }, [currentUserId, queryClient]);

  const stateValue = useMemo(
    () => ({ isLiked, getLikeCount }),
    [isLiked, getLikeCount]
  );

  const actionsValue = useMemo(
    () => ({ toggleLike }),
    [toggleLike]
  );

  return (
    <LikeActionsContext.Provider value={actionsValue}>
      <LikeStateContext.Provider value={stateValue}>
        {children}
      </LikeStateContext.Provider>
    </LikeActionsContext.Provider>
  );
}

export function useLike() {
  const state = useContext(LikeStateContext);
  const actions = useContext(LikeActionsContext);
  if (!state || !actions) {
    throw new Error('useLike must be used within a LikeProvider');
  }
  return { ...state, ...actions };
}

export function useLikeActions() {
  const context = useContext(LikeActionsContext);
  if (!context) {
    throw new Error('useLikeActions must be used within a LikeProvider');
  }
  return context;
}
