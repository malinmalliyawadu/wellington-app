import { supabase } from '../lib/supabase';
import type { Post, PostType, MediaItem } from '../types';

const POST_SELECT = '*, post_media(*)';

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export async function getPostById(postId: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
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
    .select(POST_SELECT)
    .eq('place_id', placeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export async function getPostsByUserId(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
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
    .select(POST_SELECT)
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
  mediaItems?: Array<{
    mediaUrl: string;
    thumbnailUrl?: string;
    mediaType: 'photo' | 'video';
    mediaWidth?: number;
    mediaHeight?: number;
    sortOrder: number;
  }>;
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

  // Insert media items if provided
  if (post.mediaItems && post.mediaItems.length > 0) {
    const { error: mediaError } = await supabase.from('post_media').insert(
      post.mediaItems.map((item) => ({
        post_id: data.id,
        media_url: item.mediaUrl,
        thumbnail_url: item.thumbnailUrl ?? null,
        media_type: item.mediaType,
        media_width: item.mediaWidth ?? null,
        media_height: item.mediaHeight ?? null,
        sort_order: item.sortOrder,
      }))
    );

    if (mediaError) throw mediaError;

    // Re-fetch to get the complete post with media
    const complete = await getPostById(data.id);
    if (!complete) throw new Error('Failed to fetch created post');
    return complete;
  }

  return mapPost(data);
}

function mapMediaItem(row: {
  id: string;
  media_url: string;
  thumbnail_url: string | null;
  media_type: string;
  media_width: number | null;
  media_height: number | null;
  sort_order: number;
}): MediaItem {
  return {
    id: row.id,
    mediaUrl: row.media_url,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    mediaType: row.media_type as MediaItem['mediaType'],
    mediaWidth: row.media_width ?? undefined,
    mediaHeight: row.media_height ?? undefined,
    sortOrder: row.sort_order,
  };
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
  post_media?: Array<{
    id: string;
    media_url: string;
    thumbnail_url: string | null;
    media_type: string;
    media_width: number | null;
    media_height: number | null;
    sort_order: number;
  }>;
}): Post {
  const mediaRows = row.post_media ?? [];
  const media = mediaRows
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(mapMediaItem);

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
    media: media.length > 0 ? media : undefined,
  };
}
