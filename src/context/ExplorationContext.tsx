import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useFollow } from './FollowContext';
import { getExploredPlaceIds, markPlaceExplored } from '../services/explorations';
import { checkAndUnlockAchievements } from '../services/achievements';
import { ExplorationMethod } from '../types/database';

interface ExplorationContextType {
  exploredPlaceIds: string[];
  isExplored: (placeId: string) => boolean;
  markExplored: (placeId: string, method: ExplorationMethod) => Promise<string[]>;
  refetchExplorations: () => void;
}

const ExplorationContext = createContext<ExplorationContextType | undefined>(undefined);

export function ExplorationProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { followingIds } = useFollow();
  const currentUserId = session?.user?.id;
  const [exploredPlaceIds, setExploredPlaceIds] = useState<string[]>([]);

  // Ref to avoid stale closure in markExplored without adding exploredPlaceIds as a dependency
  const exploredPlaceIdsRef = useRef(exploredPlaceIds);
  exploredPlaceIdsRef.current = exploredPlaceIds;

  const fetchExplorations = useCallback(async () => {
    if (!currentUserId) {
      setExploredPlaceIds([]);
      return;
    }

    try {
      const placeIds = await getExploredPlaceIds(currentUserId);
      setExploredPlaceIds(placeIds);
    } catch (error) {
      console.error('Failed to fetch explorations:', error);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchExplorations();
  }, [fetchExplorations]);

  const isExplored = useCallback(
    (placeId: string) => exploredPlaceIds.includes(placeId),
    [exploredPlaceIds]
  );

  const markExplored = useCallback(
    async (placeId: string, method: ExplorationMethod): Promise<string[]> => {
      if (!currentUserId) return [];

      // Read from ref to avoid exploredPlaceIds in the dependency array
      if (exploredPlaceIdsRef.current.includes(placeId)) {
        return []; // Already explored, no new achievements
      }

      // Optimistic update
      setExploredPlaceIds((prev) => [...prev, placeId]);

      try {
        // Mark as explored
        await markPlaceExplored(currentUserId, placeId, method);

        // Check for newly unlocked achievements
        const newAchievements = await checkAndUnlockAchievements(
          currentUserId,
          placeId,
          followingIds
        );

        return newAchievements;
      } catch (error) {
        console.error('Failed to mark place as explored:', error);
        // Revert optimistic update on error
        setExploredPlaceIds((prev) => prev.filter((id) => id !== placeId));
        return [];
      }
    },
    [currentUserId, followingIds]
  );

  const refetchExplorations = useCallback(() => {
    fetchExplorations();
  }, [fetchExplorations]);

  const value = useMemo(
    () => ({ exploredPlaceIds, isExplored, markExplored, refetchExplorations }),
    [exploredPlaceIds, isExplored, markExplored, refetchExplorations]
  );

  return (
    <ExplorationContext.Provider value={value}>
      {children}
    </ExplorationContext.Provider>
  );
}

export function useExploration() {
  const context = useContext(ExplorationContext);
  if (!context) {
    throw new Error('useExploration must be used within an ExplorationProvider');
  }
  return context;
}
