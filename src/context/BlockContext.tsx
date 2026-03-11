import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { getBlockedIds, blockUser as blockUserApi, unblockUser as unblockUserApi } from '../services/blocks';
import { posthog } from '../config/posthog';

interface BlockContextType {
  blockedIds: string[];
  isBlocked: (userId: string) => boolean;
  toggleBlock: (userId: string) => void;
}

const BlockContext = createContext<BlockContextType | undefined>(undefined);

export function BlockProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const currentUserId = session?.user?.id;
  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  const refreshFromServer = useCallback(() => {
    if (!currentUserId) return;
    getBlockedIds(currentUserId)
      .then(setBlockedIds)
      .catch((e) => console.warn('Failed to load blocked IDs:', e));
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      setBlockedIds([]);
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

  const isBlocked = useCallback(
    (userId: string) => blockedIds.includes(userId),
    [blockedIds]
  );

  const toggleBlock = useCallback((userId: string) => {
    if (!currentUserId) return;

    setBlockedIds((prev) => {
      const alreadyBlocked = prev.includes(userId);
      const next = alreadyBlocked
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];

      posthog.capture('user_blocked', {
        blocked: !alreadyBlocked,
        blocked_user_id: userId,
      });

      const apiCall = alreadyBlocked
        ? unblockUserApi(currentUserId, userId)
        : blockUserApi(currentUserId, userId);

      apiCall
        .then(() => {
          // Invalidate caches that may contain content from the blocked user
          queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
          queryClient.invalidateQueries({ queryKey: ['feedGuides'] });
          queryClient.invalidateQueries({ queryKey: ['q', 'feed'] });
          queryClient.invalidateQueries({ queryKey: ['q', ['follow-counts']] });
          queryClient.invalidateQueries({ queryKey: ['q', ['followers']] });
          queryClient.invalidateQueries({ queryKey: ['q', ['following']] });
        })
        .catch(() => {
          // Revert on error
          setBlockedIds((current) =>
            alreadyBlocked
              ? [...current, userId]
              : current.filter((id) => id !== userId)
          );
        });

      return next;
    });
  }, [currentUserId, queryClient]);

  return (
    <BlockContext.Provider value={{ blockedIds, isBlocked, toggleBlock }}>
      {children}
    </BlockContext.Provider>
  );
}

export function useBlock() {
  const context = useContext(BlockContext);
  if (!context) {
    throw new Error('useBlock must be used within a BlockProvider');
  }
  return context;
}
