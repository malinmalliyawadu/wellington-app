import { supabase } from '../lib/supabase';
import type { NotInterestedItemType } from '../types/database';

export async function getNotInterestedItemIds(
  userId: string
): Promise<{ events: string[]; places: string[] }> {
  const { data, error } = await supabase
    .from('not_interested' as any)
    .select('item_type, item_id')
    .eq('user_id', userId);

  if (error) throw error;

  const result = { events: [] as string[], places: [] as string[] };
  for (const row of (data ?? []) as any[]) {
    if (row.item_type === 'event') result.events.push(row.item_id);
    else if (row.item_type === 'place') result.places.push(row.item_id);
  }
  return result;
}

export async function markNotInterested(
  userId: string,
  itemType: NotInterestedItemType,
  itemId: string
): Promise<void> {
  const { error } = await supabase
    .from('not_interested' as any)
    .insert({ user_id: userId, item_type: itemType, item_id: itemId });

  if (error) throw error;
}

export async function removeNotInterested(
  userId: string,
  itemType: NotInterestedItemType,
  itemId: string
): Promise<void> {
  const { error } = await supabase
    .from('not_interested' as any)
    .delete()
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .eq('item_id', itemId);

  if (error) throw error;
}
