import React, { createContext, useContext, useState, useCallback } from 'react';
import { mockPosts } from '../data/mockPosts';

interface LikeContextType {
  isLiked: (postId: string) => boolean;
  toggleLike: (postId: string) => void;
  getLikeCount: (postId: string) => number;
}

const LikeContext = createContext<LikeContextType | undefined>(undefined);

export function LikeProvider({ children }: { children: React.ReactNode }) {
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const post of mockPosts) {
      counts[post.id] = post.likes;
    }
    return counts;
  });

  const isLiked = useCallback(
    (postId: string) => likedPostIds.includes(postId),
    [likedPostIds]
  );

  const toggleLike = useCallback((postId: string) => {
    setLikedPostIds((prev) => {
      const alreadyLiked = prev.includes(postId);
      setLikeCounts((counts) => ({
        ...counts,
        [postId]: (counts[postId] ?? 0) + (alreadyLiked ? -1 : 1),
      }));
      return alreadyLiked ? prev.filter((id) => id !== postId) : [...prev, postId];
    });
  }, []);

  const getLikeCount = useCallback(
    (postId: string) => likeCounts[postId] ?? 0,
    [likeCounts]
  );

  return (
    <LikeContext.Provider value={{ isLiked, toggleLike, getLikeCount }}>
      {children}
    </LikeContext.Provider>
  );
}

export function useLike() {
  const context = useContext(LikeContext);
  if (!context) {
    throw new Error('useLike must be used within a LikeProvider');
  }
  return context;
}
