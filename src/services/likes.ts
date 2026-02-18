import { supabase } from '../lib/supabase';

export async function getLikedPostIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.post_id);
}

export async function likePost(userId: string, postId: string): Promise<void> {
  const { error } = await supabase
    .from('post_likes')
    .insert({ user_id: userId, post_id: postId });

  if (error) throw error;
}

export async function unlikePost(userId: string, postId: string): Promise<void> {
  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);

  if (error) throw error;
}

export async function getLikerIds(postId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('post_likes')
    .select('user_id')
    .eq('post_id', postId);

  if (error) throw error;
  return (data ?? []).map((row) => row.user_id);
}

export async function getAllLikeCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id');

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.post_id] = (counts[row.post_id] ?? 0) + 1;
  }
  return counts;
}
