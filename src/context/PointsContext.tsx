import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { useFollow } from './FollowContext';
import { useToast } from './ToastContext';
import { getExploredPlaceIds, markPlaceExplored, unmarkPlaceExplored, hasFollowedUserExploredPlace } from '../services/explorations';
import { checkAndUnlockAchievements, computeEarnedBadgeIds } from '../services/achievements';
import { awardPoints, getUserPointTotals } from '../services/points';
import { ExplorationMethod } from '../types/database';
import { PointActionType, UserPointTotals, LevelDefinition } from '../types/Exploration';
import { getLevelForPoints, getPointsToNextLevel, LEVEL_DEFINITIONS } from '../data/achievementDefinitions';
import { createLevelUpToast, createBadgeToast } from '../utils/achievementHelpers';

interface PointsContextType {
  // Exploration (preserved interface)
  exploredPlaceIds: string[];
  isExplored: (placeId: string) => boolean;
  markExplored: (placeId: string, method: ExplorationMethod) => Promise<string[]>;
  unmarkExplored: (placeId: string) => Promise<void>;
  toggleExplored: (placeId: string) => Promise<void>;
  refetchExplorations: () => void;

  // Points & leveling
  totalPoints: number;
  level: number;
  levelDefinition: LevelDefinition;
  pointsToNextLevel: number;
  nextLevelProgress: number;
  awardPointsForAction: (actionType: PointActionType, referenceId?: string) => Promise<void>;
  refetchTotals: () => void;
  pointTotals: UserPointTotals | null;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export function PointsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { followingIds } = useFollow();
  const { showToast } = useToast();
  const currentUserId = session?.user?.id;

  const [exploredPlaceIds, setExploredPlaceIds] = useState<string[]>([]);
  const [pointTotals, setPointTotals] = useState<UserPointTotals | null>(null);

  const exploredPlaceIdsRef = useRef(exploredPlaceIds);
  exploredPlaceIdsRef.current = exploredPlaceIds;

  // Track earned badge IDs for toast detection
  const earnedBadgeIdsRef = useRef<Set<string>>(new Set());

  // Fetch explorations
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

  // Fetch point totals
  const fetchTotals = useCallback(async () => {
    if (!currentUserId) {
      setPointTotals(null);
      return;
    }
    try {
      const totals = await getUserPointTotals(currentUserId);
      setPointTotals(totals);
      // Initialize earned badges ref so we don't toast for existing badges
      if (totals) {
        earnedBadgeIdsRef.current = computeEarnedBadgeIds(totals);
      }
    } catch (error) {
      console.error('Failed to fetch point totals:', error);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchExplorations();
    fetchTotals();
  }, [fetchExplorations, fetchTotals]);

  // Refresh when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        fetchExplorations();
        fetchTotals();
      }
    });
    return () => sub.remove();
  }, [fetchExplorations, fetchTotals]);

  const isExplored = useCallback(
    (placeId: string) => exploredPlaceIds.includes(placeId),
    [exploredPlaceIds]
  );

  const markExplored = useCallback(
    async (placeId: string, method: ExplorationMethod): Promise<string[]> => {
      if (!currentUserId) return [];
      if (exploredPlaceIdsRef.current.includes(placeId)) return [];

      // Optimistic update
      setExploredPlaceIds((prev) => [...prev, placeId]);

      try {
        await markPlaceExplored(currentUserId, placeId, method);

        // Check first discover bonus
        const isFirstDiscover = !(await hasFollowedUserExploredPlace(placeId, followingIds));
        let result: { leveledUp: boolean; newLevel: number } | null = null;
        if (isFirstDiscover && followingIds.length > 0) {
          result = await awardPoints(currentUserId, 'first_discover', placeId);
        }

        // Update local totals
        const updatedTotals = await getUserPointTotals(currentUserId);
        setPointTotals(updatedTotals);

        // Show level-up toast
        if (result?.leveledUp) {
          const levelDef = LEVEL_DEFINITIONS.find((l) => l.level === result!.newLevel);
          if (levelDef) {
            showToast(createLevelUpToast(levelDef));
          }
        }

        // Check for newly earned badges (computed, not persisted)
        if (updatedTotals) {
          const newEarned = computeEarnedBadgeIds(updatedTotals);
          const newBadgeIds = [...newEarned].filter((id) => !earnedBadgeIdsRef.current.has(id));
          earnedBadgeIdsRef.current = newEarned;
          if (newBadgeIds.length > 0) {
            setTimeout(
              () => showToast(createBadgeToast(newBadgeIds[0])),
              result?.leveledUp ? 4500 : 0
            );
          }
        }

        // Also check legacy achievements
        const newAchievements = await checkAndUnlockAchievements(currentUserId, placeId, followingIds);

        return newAchievements;
      } catch (error) {
        console.error('Failed to mark place as explored:', error);
        setExploredPlaceIds((prev) => prev.filter((id) => id !== placeId));
        return [];
      }
    },
    [currentUserId, followingIds, showToast]
  );

  const unmarkExplored = useCallback(
    async (placeId: string): Promise<void> => {
      if (!currentUserId) return;
      if (!exploredPlaceIdsRef.current.includes(placeId)) return;

      // Optimistic update
      setExploredPlaceIds((prev) => prev.filter((id) => id !== placeId));

      try {
        await unmarkPlaceExplored(currentUserId, placeId);
      } catch (error) {
        console.error('Failed to unmark place as explored:', error);
        setExploredPlaceIds((prev) => [...prev, placeId]);
      }
    },
    [currentUserId]
  );

  const toggleExplored = useCallback(
    async (placeId: string): Promise<void> => {
      if (exploredPlaceIdsRef.current.includes(placeId)) {
        await unmarkExplored(placeId);
      } else {
        await markExplored(placeId, 'manual');
      }
    },
    [markExplored, unmarkExplored]
  );

  const awardPointsForAction = useCallback(
    async (actionType: PointActionType, referenceId?: string) => {
      if (!currentUserId) return;

      try {
        const result = await awardPoints(currentUserId, actionType, referenceId);

        // Update local totals
        const updatedTotals = await getUserPointTotals(currentUserId);
        setPointTotals(updatedTotals);

        // Show level-up toast
        if (result.leveledUp) {
          const levelDef = LEVEL_DEFINITIONS.find((l) => l.level === result.newLevel);
          if (levelDef) {
            showToast(createLevelUpToast(levelDef));
          }
        }

        // Check for newly earned badges (computed, not persisted)
        if (updatedTotals) {
          const newEarned = computeEarnedBadgeIds(updatedTotals);
          const newBadgeIds = [...newEarned].filter((id) => !earnedBadgeIdsRef.current.has(id));
          earnedBadgeIdsRef.current = newEarned;
          if (newBadgeIds.length > 0) {
            setTimeout(
              () => showToast(createBadgeToast(newBadgeIds[0])),
              result.leveledUp ? 4500 : 0
            );
          }
        }
      } catch (error) {
        console.error('Failed to award points:', error);
      }
    },
    [currentUserId, showToast]
  );

  const refetchExplorations = useCallback(() => {
    fetchExplorations();
  }, [fetchExplorations]);

  const refetchTotals = useCallback(() => {
    fetchTotals();
  }, [fetchTotals]);

  // Derived values
  const totalPoints = pointTotals?.totalPoints ?? 0;
  const level = pointTotals?.level ?? 1;
  const levelDefinition = getLevelForPoints(totalPoints);
  const { pointsNeeded, progress } = getPointsToNextLevel(totalPoints);

  const value = useMemo(
    () => ({
      exploredPlaceIds,
      isExplored,
      markExplored,
      unmarkExplored,
      toggleExplored,
      refetchExplorations,
      totalPoints,
      level,
      levelDefinition,
      pointsToNextLevel: pointsNeeded,
      nextLevelProgress: progress,
      awardPointsForAction,
      refetchTotals,
      pointTotals,
    }),
    [
      exploredPlaceIds,
      isExplored,
      markExplored,
      unmarkExplored,
      toggleExplored,
      refetchExplorations,
      totalPoints,
      level,
      levelDefinition,
      pointsNeeded,
      progress,
      awardPointsForAction,
      refetchTotals,
      pointTotals,
    ]
  );

  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const context = useContext(PointsContext);
  if (!context) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
}

/**
 * Backward-compatible hook that matches the old useExploration() interface.
 */
export function useExploration() {
  const { exploredPlaceIds, isExplored, markExplored, unmarkExplored, toggleExplored, refetchExplorations } = usePoints();
  return { exploredPlaceIds, isExplored, markExplored, unmarkExplored, toggleExplored, refetchExplorations };
}
