import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getLikedPostIds, likePost, unlikePost } from '../services/likes';

interface LikeContextType {
  isLiked: (postId: string) => boolean;
  toggleLike: (postId: string) => void;
  getLikeCount: (postId: string) => number;
}

const LikeContext = createContext<LikeContextType | undefined>(undefined);

export function LikeProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!currentUserId) {
      setLikedPostIds([]);
      return;
    }

    getLikedPostIds(currentUserId)
      .then(setLikedPostIds)
      .catch(() => {});
  }, [currentUserId]);

  const isLiked = useCallback(
    (postId: string) => likedPostIds.includes(postId),
    [likedPostIds]
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

      apiCall.catch(() => {
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
  }, [currentUserId]);

  const getLikeCount = useCallback(
    (postId: string) => likeCounts[postId] ?? 0,
    [likeCounts]
  );

  // Helper to initialize like counts from fetched posts
  const initLikeCounts = useCallback((posts: Array<{ id: string; likes: number }>) => {
    setLikeCounts((prev) => {
      const next = { ...prev };
      for (const post of posts) {
        if (!(post.id in next)) {
          next[post.id] = post.likes;
        }
      }
      return next;
    });
  }, []);

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
