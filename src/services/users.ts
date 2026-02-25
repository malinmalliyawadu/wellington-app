import { supabase } from '../lib/supabase';
import type { User } from '../types';

export async function getProfileById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapProfile(data);
}

export async function getProfileByUsername(username: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapProfile(data);
}

export async function getProfiles(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('display_name');

  if (error) throw error;
  return (data ?? []).map(mapProfile);
}

export async function getOtherProfiles(currentUserId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .order('display_name');

  if (error) throw error;
  return (data ?? []).map(mapProfile);
}

export async function getProfilesByIds(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', ids);

  if (error) throw error;
  return (data ?? []).map(mapProfile);
}

export async function updateProfile(
  id: string,
  updates: { username?: string; displayName?: string; avatarUrl?: string; bio?: string; profileVisibility?: string; instagramUsername?: string; tiktokUsername?: string; xUsername?: string }
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...(updates.username !== undefined && { username: updates.username }),
      ...(updates.displayName !== undefined && { display_name: updates.displayName }),
      ...(updates.avatarUrl !== undefined && { avatar_url: updates.avatarUrl }),
      ...(updates.bio !== undefined && { bio: updates.bio }),
      ...(updates.profileVisibility !== undefined && { profile_visibility: updates.profileVisibility }),
      ...(updates.instagramUsername !== undefined && { instagram_username: updates.instagramUsername || null }),
      ...(updates.tiktokUsername !== undefined && { tiktok_username: updates.tiktokUsername || null }),
      ...(updates.xUsername !== undefined && { x_username: updates.xUsername || null }),
    })
    .eq('id', id);

  if (error) throw error;
}

function mapProfile(row: {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string | null;
  profile_visibility?: string | null;
  instagram_username?: string | null;
  tiktok_username?: string | null;
  x_username?: string | null;
}): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio ?? undefined,
    profileVisibility: (row.profile_visibility as User['profileVisibility']) ?? 'public',
    instagramUsername: row.instagram_username ?? undefined,
    tiktokUsername: row.tiktok_username ?? undefined,
    xUsername: row.x_username ?? undefined,
  };
}
