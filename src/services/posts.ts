import { supabase } from '../lib/supabase';
import type { Post, PostType } from '../types';

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export async function getPostById(postId: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapPost(data);
}

export async function getPostsByPlaceId(placeId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export async function getPostsByUserId(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export async function getFeedPosts(followingIds: string[], currentUserId?: string): Promise<Post[]> {
  // Include both followed users and the current user's posts
  const userIds = currentUserId
    ? [...new Set([...followingIds, currentUserId])]
    : followingIds;

  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .in('user_id', userIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export async function createPost(post: {
  userId: string;
  placeId: string;
  type: PostType;
  content: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  mediaWidth?: number;
  mediaHeight?: number;
}): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: post.userId,
      place_id: post.placeId,
      type: post.type,
      content: post.content,
      media_url: post.mediaUrl ?? null,
      thumbnail_url: post.thumbnailUrl ?? null,
      media_width: post.mediaWidth ?? null,
      media_height: post.mediaHeight ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapPost(data);
}

function mapPost(row: {
  id: string;
  user_id: string;
  place_id: string;
  type: string;
  content: string;
  media_url: string | null;
  thumbnail_url: string | null;
  media_width?: number | null;
  media_height?: number | null;
  likes: number;
  created_at: string;
}): Post {
  return {
    id: row.id,
    userId: row.user_id,
    placeId: row.place_id,
    type: row.type as Post['type'],
    content: row.content,
    mediaUrl: row.media_url ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    mediaWidth: row.media_width ?? undefined,
    mediaHeight: row.media_height ?? undefined,
    likes: row.likes,
    createdAt: row.created_at,
  };
}
