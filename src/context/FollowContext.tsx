import React, { createContext, useContext, useState, useCallback } from 'react';
import { initialFollowingIds } from '../data/mockFollows';

interface FollowContextType {
  followingIds: string[];
  isFollowing: (userId: string) => boolean;
  toggleFollow: (userId: string) => void;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const [followingIds, setFollowingIds] = useState<string[]>(initialFollowingIds);

  const isFollowing = useCallback(
    (userId: string) => followingIds.includes(userId),
    [followingIds]
  );

  const toggleFollow = useCallback((userId: string) => {
    setFollowingIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }, []);

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
