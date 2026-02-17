import { supabase } from '../lib/supabase';
import { ExplorationMethod } from '../types/database';
import { ExplorationStats } from '../types/Exploration';
import { getNeighborhood } from '../utils/neighborhoods';

/**
 * Get all explored place IDs for a user
 */
export async function getExploredPlaceIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_explorations')
    .select('place_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.place_id);
}

/**
 * Mark a place as explored by a user
 * Uses upsert to handle duplicate explorations gracefully
 */
export async function markPlaceExplored(
  userId: string,
  placeId: string,
  method: ExplorationMethod
): Promise<void> {
  const { error } = await supabase
    .from('user_explorations')
    .upsert(
      {
        user_id: userId,
        place_id: placeId,
        exploration_method: method,
      },
      {
        onConflict: 'user_id,place_id',
        ignoreDuplicates: true,
      }
    );

  if (error) throw error;
}

/**
 * Get exploration statistics for a user
 */
export async function getExplorationStats(userId: string): Promise<ExplorationStats> {
  // Get explored place IDs
  const { data: explorations, error } = await supabase
    .from('user_explorations')
    .select('place_id')
    .eq('user_id', userId);

  if (error) throw error;

  const placeIds = (explorations ?? []).map((e) => e.place_id);
  if (placeIds.length === 0) {
    return { totalPlaces: 0, byCategory: {}, byNeighborhood: {} };
  }

  // Fetch place details separately to avoid PostgREST FK join issues
  const { data: places, error: placesError } = await supabase
    .from('places')
    .select('id, category, latitude, longitude')
    .in('id', placeIds);

  if (placesError) throw placesError;

  const placesMap = new Map((places ?? []).map((p) => [p.id, p]));

  const byCategory: Record<string, number> = {};
  const byNeighborhood: Record<string, number> = {};

  placeIds.forEach((placeId) => {
    const place = placesMap.get(placeId);
    if (!place) return;

    // Count by category
    byCategory[place.category] = (byCategory[place.category] ?? 0) + 1;

    // Count by neighborhood
    const neighborhood = getNeighborhood(place.latitude, place.longitude);
    if (neighborhood) {
      byNeighborhood[neighborhood] = (byNeighborhood[neighborhood] ?? 0) + 1;
    }
  });

  return {
    totalPlaces: placeIds.length,
    byCategory,
    byNeighborhood,
  };
}

/**
 * Check if a user has explored a place
 */
export async function hasExploredPlace(userId: string, placeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_explorations')
    .select('user_id')
    .eq('user_id', userId)
    .eq('place_id', placeId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return !!data;
}

/**
 * Get exploration count for a place (how many users have explored it)
 */
export async function getPlaceExplorationCount(placeId: string): Promise<number> {
  const { count, error } = await supabase
    .from('user_explorations')
    .select('*', { count: 'exact', head: true })
    .eq('place_id', placeId);

  if (error) throw error;
  return count ?? 0;
}

/**
 * Check if any followed user has explored a place
 * Used for "First Explorer" social achievement
 */
export async function hasFollowedUserExploredPlace(
  placeId: string,
  followingIds: string[]
): Promise<boolean> {
  if (followingIds.length === 0) return false;

  const { data, error } = await supabase
    .from('user_explorations')
    .select('user_id')
    .eq('place_id', placeId)
    .in('user_id', followingIds)
    .limit(1);

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

/**
 * Get recent explorations at a place by followed users (within 24 hours)
 * Used for "Friend Tracker" social achievement
 */
export async function getRecentFollowedExplorations(
  placeId: string,
  followingIds: string[]
): Promise<string[]> {
  if (followingIds.length === 0) return [];

  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  const { data, error } = await supabase
    .from('user_explorations')
    .select('user_id')
    .eq('place_id', placeId)
    .in('user_id', followingIds)
    .gte('explored_at', oneDayAgo.toISOString());

  if (error) throw error;
  return (data ?? []).map((row) => row.user_id);
}
