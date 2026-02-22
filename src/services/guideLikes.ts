import { supabase } from '../lib/supabase';

export async function getLikedGuideIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('guide_likes')
    .select('guide_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.guide_id);
}

export async function likeGuide(userId: string, guideId: string): Promise<void> {
  const { error } = await supabase
    .from('guide_likes')
    .insert({ user_id: userId, guide_id: guideId });

  if (error) throw error;
}

export async function unlikeGuide(userId: string, guideId: string): Promise<void> {
  const { error } = await supabase
    .from('guide_likes')
    .delete()
    .eq('user_id', userId)
    .eq('guide_id', guideId);

  if (error) throw error;
}

export async function getGuideLikerIds(guideId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('guide_likes')
    .select('user_id')
    .eq('guide_id', guideId);

  if (error) throw error;
  return (data ?? []).map((row) => row.user_id);
}

export async function getAllGuideLikeCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('guide_likes')
    .select('guide_id');

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.guide_id] = (counts[row.guide_id] ?? 0) + 1;
  }
  return counts;
}
