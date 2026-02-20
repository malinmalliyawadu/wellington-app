import { supabase } from '../lib/supabase';
import type { Hashtag } from '../types';

function mapHashtag(row: {
  id: string;
  name: string;
  post_count: number;
  created_at: string;
}): Hashtag {
  return {
    id: row.id,
    name: row.name,
    postCount: row.post_count,
    createdAt: row.created_at,
  };
}

export async function getOrCreateHashtags(names: string[]): Promise<Hashtag[]> {
  if (names.length === 0) return [];

  // Upsert all hashtags (on conflict do nothing)
  const { error: upsertError } = await supabase
    .from('hashtags')
    .upsert(
      names.map((name) => ({ name })),
      { onConflict: 'name', ignoreDuplicates: true }
    );

  if (upsertError) throw upsertError;

  // Fetch all by name
  const { data, error } = await supabase
    .from('hashtags')
    .select('*')
    .in('name', names);

  if (error) throw error;
  return (data ?? []).map(mapHashtag);
}

export async function linkHashtagsToPost(
  postId: string,
  hashtagIds: string[]
): Promise<void> {
  if (hashtagIds.length === 0) return;

  const { error } = await supabase.from('post_hashtags').insert(
    hashtagIds.map((hashtagId) => ({
      post_id: postId,
      hashtag_id: hashtagId,
    }))
  );

  if (error) throw error;
}

export async function unlinkHashtagsFromPost(postId: string): Promise<void> {
  const { error } = await supabase
    .from('post_hashtags')
    .delete()
    .eq('post_id', postId);

  if (error) throw error;
}

export async function getTrendingHashtags(limit = 20): Promise<Hashtag[]> {
  const { data, error } = await supabase
    .from('hashtags')
    .select('*')
    .gt('post_count', 0)
    .order('post_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapHashtag);
}

export async function getHashtagByName(name: string): Promise<Hashtag | null> {
  const { data, error } = await supabase
    .from('hashtags')
    .select('*')
    .eq('name', name.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapHashtag(data);
}

export async function getPostIdsByHashtagId(hashtagId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('post_hashtags')
    .select('post_id')
    .eq('hashtag_id', hashtagId);

  if (error) throw error;
  return (data ?? []).map((row) => row.post_id);
}

export async function searchHashtags(prefix: string, limit = 10): Promise<Hashtag[]> {
  const { data, error } = await supabase
    .from('hashtags')
    .select('*')
    .ilike('name', `${prefix.toLowerCase()}%`)
    .gt('post_count', 0)
    .order('post_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapHashtag);
}
