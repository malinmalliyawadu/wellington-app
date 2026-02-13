import { supabase } from '../lib/supabase';
import { AchievementProgress } from '../types/Exploration';
import { ACHIEVEMENT_DEFINITIONS } from '../data/achievementDefinitions';
import { getExplorationStats, hasFollowedUserExploredPlace, getRecentFollowedExplorations } from './explorations';
import { getPlaces } from './places';
import { getNeighborhood } from '../utils/neighborhoods';

/**
 * Get all achievement progress for a user
 */
export async function getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
  // Get user's unlocked achievements
  const { data: unlockedAchievements, error } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at, progress')
    .eq('user_id', userId);

  if (error) throw error;

  // Get exploration stats for progress calculation
  const stats = await getExplorationStats(userId);
  const allPlaces = await getPlaces();

  // Map definitions to progress objects
  const progress: AchievementProgress[] = ACHIEVEMENT_DEFINITIONS.map((definition) => {
    const unlocked = unlockedAchievements?.find((ua) => ua.achievement_id === definition.id);

    if (unlocked) {
      return {
        ...definition,
        unlocked: true,
        unlockedAt: unlocked.unlocked_at,
      };
    }

    // Calculate current progress for locked achievements
    let currentProgress = 0;
    let requiredProgress = 0;

    if (definition.type === 'milestone') {
      currentProgress = stats.totalPlaces;
      requiredProgress = definition.requirement.count ?? 0;
    } else if (definition.type === 'category') {
      const category = definition.requirement.category;
      currentProgress = stats.byCategory[category!] ?? 0;
      requiredProgress = allPlaces.filter((p) => p.category === category).length;
    } else if (definition.type === 'neighborhood') {
      const neighborhood = definition.requirement.neighborhood;
      currentProgress = stats.byNeighborhood[neighborhood!] ?? 0;
      requiredProgress = allPlaces.filter(
        (p) => getNeighborhood(p.latitude, p.longitude) === neighborhood
      ).length;
    } else if (definition.type === 'social') {
      // Social achievements don't show numeric progress
      currentProgress = 0;
      requiredProgress = 0;
    }

    return {
      ...definition,
      unlocked: false,
      currentProgress,
      requiredProgress,
    };
  });

  return progress;
}

/**
 * Check and unlock achievements after a new exploration
 * Returns array of newly unlocked achievement IDs
 */
export async function checkAndUnlockAchievements(
  userId: string,
  placeId?: string,
  followingIds: string[] = []
): Promise<string[]> {
  const newlyUnlocked: string[] = [];

  // Get current stats
  const stats = await getExplorationStats(userId);
  const allPlaces = await getPlaces();

  // Check milestone achievements
  for (const achievement of ACHIEVEMENT_DEFINITIONS.filter((a) => a.type === 'milestone')) {
    const required = achievement.requirement.count ?? 0;
    if (stats.totalPlaces >= required) {
      const unlocked = await unlockAchievement(userId, achievement.id, {
        total: stats.totalPlaces,
      });
      if (unlocked) newlyUnlocked.push(achievement.id);
    }
  }

  // Check category achievements
  for (const achievement of ACHIEVEMENT_DEFINITIONS.filter((a) => a.type === 'category')) {
    const category = achievement.requirement.category!;
    const totalInCategory = allPlaces.filter((p) => p.category === category).length;
    const exploredInCategory = stats.byCategory[category] ?? 0;

    if (exploredInCategory >= totalInCategory && totalInCategory > 0) {
      const unlocked = await unlockAchievement(userId, achievement.id, {
        category,
        count: exploredInCategory,
      });
      if (unlocked) newlyUnlocked.push(achievement.id);
    }
  }

  // Check neighborhood achievements
  for (const achievement of ACHIEVEMENT_DEFINITIONS.filter((a) => a.type === 'neighborhood')) {
    const neighborhood = achievement.requirement.neighborhood!;
    const totalInNeighborhood = allPlaces.filter(
      (p) => getNeighborhood(p.latitude, p.longitude) === neighborhood
    ).length;
    const exploredInNeighborhood = stats.byNeighborhood[neighborhood] ?? 0;

    if (exploredInNeighborhood >= totalInNeighborhood && totalInNeighborhood > 0) {
      const unlocked = await unlockAchievement(userId, achievement.id, {
        neighborhood,
        count: exploredInNeighborhood,
      });
      if (unlocked) newlyUnlocked.push(achievement.id);
    }
  }

  // Check social achievements (only if placeId provided)
  if (placeId) {
    // First Explorer - be first among friends to discover a place
    const hasFollowedExplored = await hasFollowedUserExploredPlace(placeId, followingIds);
    if (!hasFollowedExplored && followingIds.length > 0) {
      const unlocked = await unlockAchievement(userId, 'first_explorer', {
        placeId,
      });
      if (unlocked) newlyUnlocked.push('first_explorer');
    }

    // Friend Tracker - visit within 24 hours of a friend
    const recentFriends = await getRecentFollowedExplorations(placeId, followingIds);
    if (recentFriends.length > 0) {
      const unlocked = await unlockAchievement(userId, 'friend_tracker', {
        placeId,
        friendIds: recentFriends,
      });
      if (unlocked) newlyUnlocked.push('friend_tracker');
    }

    // Social Butterfly - visit 5 places where friends have posted
    // This requires checking if friends have posted at explored places
    // For now, we'll implement a simplified version based on exploration overlap
    const exploredPlaceIds = await getExploredPlaceIds(userId);
    let friendPlacesCount = 0;

    for (const exploredPlaceId of exploredPlaceIds) {
      const hasFriendExplored = await hasFollowedUserExploredPlace(exploredPlaceId, followingIds);
      if (hasFriendExplored) friendPlacesCount++;
    }

    if (friendPlacesCount >= 5) {
      const unlocked = await unlockAchievement(userId, 'social_butterfly', {
        count: friendPlacesCount,
      });
      if (unlocked) newlyUnlocked.push('social_butterfly');
    }
  }

  return newlyUnlocked;
}

/**
 * Unlock a specific achievement for a user
 * Returns true if newly unlocked, false if already unlocked
 */
export async function unlockAchievement(
  userId: string,
  achievementId: string,
  progress: Record<string, any> = {}
): Promise<boolean> {
  // Check if already unlocked
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .single();

  if (existing) return false; // Already unlocked

  // Unlock the achievement
  const { error } = await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_id: achievementId,
    progress,
  });

  if (error) throw error;
  return true;
}

/**
 * Get count of unlocked achievements for a user
 */
export async function getUnlockedAchievementCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('user_achievements')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count ?? 0;
}

/**
 * Helper to get explored place IDs (used in social butterfly check)
 */
async function getExploredPlaceIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_explorations')
    .select('place_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.place_id);
}
