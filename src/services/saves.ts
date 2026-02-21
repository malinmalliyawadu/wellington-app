import { supabase } from '../lib/supabase';
import type { SavedItemType } from '../types/database';

export async function getSavedItemIds(
  userId: string
): Promise<{ posts: string[]; places: string[]; events: string[]; guides: string[] }> {
  const { data, error } = await supabase
    .from('saved_items')
    .select('item_type, item_id')
    .eq('user_id', userId);

  if (error) throw error;

  const result = { posts: [] as string[], places: [] as string[], events: [] as string[], guides: [] as string[] };
  for (const row of data ?? []) {
    if (row.item_type === 'post') result.posts.push(row.item_id);
    else if (row.item_type === 'place') result.places.push(row.item_id);
    else if (row.item_type === 'event') result.events.push(row.item_id);
    else if (row.item_type === 'guide') result.guides.push(row.item_id);
  }
  return result;
}

export async function saveItem(
  userId: string,
  itemType: SavedItemType,
  itemId: string
): Promise<void> {
  const { error } = await supabase
    .from('saved_items')
    .insert({ user_id: userId, item_type: itemType, item_id: itemId });

  if (error) throw error;
}

export async function unsaveItem(
  userId: string,
  itemType: SavedItemType,
  itemId: string
): Promise<void> {
  const { error } = await supabase
    .from('saved_items')
    .delete()
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .eq('item_id', itemId);

  if (error) throw error;
}
