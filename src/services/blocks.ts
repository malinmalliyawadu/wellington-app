import { supabase } from '../lib/supabase';

export async function getBlockedIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_blocks' as any)
    .select('blocked_id')
    .eq('blocker_id', userId);

  if (error) throw error;
  return (data ?? []).map((row: any) => row.blocked_id);
}

export async function getBlockedByIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_blocks' as any)
    .select('blocker_id')
    .eq('blocked_id', userId);

  if (error) throw error;
  return (data ?? []).map((row: any) => row.blocker_id);
}

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase
    .from('user_blocks' as any)
    .insert({ blocker_id: blockerId, blocked_id: blockedId });

  if (error) throw error;
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase
    .from('user_blocks' as any)
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);

  if (error) throw error;
}
