import { supabase } from '../lib/supabase';
import { PointActionType, PointEntry, UserPointTotals } from '../types/Exploration';
import { POINT_VALUES, getLevelForPoints } from '../data/achievementDefinitions';

interface AwardResult {
  pointsAwarded: number;
  newTotal: number;
  leveledUp: boolean;
  newLevel: number;
}

/**
 * Award points to a user for an action.
 * Inserts a ledger row and upserts the cached totals atomically.
 */
export async function awardPoints(
  userId: string,
  actionType: PointActionType,
  referenceId?: string
): Promise<AwardResult> {
  const points = POINT_VALUES[actionType];
  if (!points) throw new Error(`Unknown action type: ${actionType}`);

  // Insert ledger entry
  const { error: insertError } = await supabase
    .from('user_points')
    .insert({ user_id: userId, action_type: actionType, points, reference_id: referenceId });

  if (insertError) throw insertError;

  // Read current totals
  const { data: current } = await supabase
    .from('user_point_totals')
    .select('total_points, level, points_by_action')
    .eq('user_id', userId)
    .single();

  const oldTotal = current?.total_points ?? 0;
  const oldLevel = current?.level ?? 1;
  const oldByAction = (current?.points_by_action as Record<string, number>) ?? {};

  const newTotal = oldTotal + points;
  const newByAction = { ...oldByAction, [actionType]: (oldByAction[actionType] ?? 0) + points };
  const newLevelDef = getLevelForPoints(newTotal);
  const newLevel = newLevelDef.level;

  // Upsert totals
  const { error: upsertError } = await supabase
    .from('user_point_totals')
    .upsert(
      {
        user_id: userId,
        total_points: newTotal,
        level: newLevel,
        points_by_action: newByAction,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (upsertError) throw upsertError;

  return {
    pointsAwarded: points,
    newTotal,
    leveledUp: newLevel > oldLevel,
    newLevel,
  };
}

/**
 * Get cached point totals for a user.
 */
export async function getUserPointTotals(userId: string): Promise<UserPointTotals | null> {
  const { data, error } = await supabase
    .from('user_point_totals')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') return null; // no row
  if (error) throw error;

  return {
    userId: data.user_id,
    totalPoints: data.total_points,
    level: data.level,
    pointsByAction: data.points_by_action as Record<string, number>,
    updatedAt: data.updated_at,
  };
}

/**
 * Get recent point history for a user.
 */
export async function getPointHistory(userId: string, limit = 20): Promise<PointEntry[]> {
  const { data, error } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    actionType: row.action_type as PointActionType,
    points: row.points,
    referenceId: row.reference_id ?? undefined,
    createdAt: row.created_at,
  }));
}
