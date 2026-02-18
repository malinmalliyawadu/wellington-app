import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  recipientId: string;
  actorId: string;
  type: 'like' | 'comment' | 'follow';
  postId: string | null;
  read: boolean;
  createdAt: string;
}

function mapRow(row: any): Notification {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    actorId: row.actor_id,
    type: row.type,
    postId: row.post_id ?? null,
    read: row.read,
    createdAt: row.created_at,
  };
}

export async function getNotifications(recipientId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getUnreadCount(recipientId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', recipientId)
    .eq('read', false);

  if (error) throw error;
  return count ?? 0;
}

export async function createLikeNotification(actorId: string, postId: string): Promise<void> {
  // Look up the post owner
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  if (postError || !post) return;

  // Don't notify yourself
  if (post.user_id === actorId) return;

  const { error } = await supabase
    .from('notifications')
    .insert({
      recipient_id: post.user_id,
      actor_id: actorId,
      type: 'like' as const,
      post_id: postId,
    });

  // Ignore unique violation (duplicate like notification)
  if (error && error.code !== '23505') throw error;
}

export async function createCommentNotification(actorId: string, postId: string): Promise<void> {
  // Look up the post owner
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  if (postError || !post) return;

  // Don't notify yourself
  if (post.user_id === actorId) return;

  const { error } = await supabase
    .from('notifications')
    .insert({
      recipient_id: post.user_id,
      actor_id: actorId,
      type: 'comment' as const,
      post_id: postId,
    });

  if (error) {
    console.error('createCommentNotification error:', error);
    throw error;
  }
}

export async function createFollowNotification(actorId: string, recipientId: string): Promise<void> {
  if (actorId === recipientId) return;

  const { error } = await supabase
    .from('notifications')
    .insert({
      recipient_id: recipientId,
      actor_id: actorId,
      type: 'follow' as const,
      post_id: null,
    });

  // Ignore unique violation (already following)
  if (error && error.code !== '23505') throw error;
}

export async function deleteNotificationForFollow(actorId: string, recipientId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('actor_id', actorId)
    .eq('recipient_id', recipientId)
    .eq('type', 'follow');

  if (error) throw error;
}

export async function deleteNotificationForLike(actorId: string, postId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('actor_id', actorId)
    .eq('post_id', postId)
    .eq('type', 'like');

  if (error) throw error;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllAsRead(recipientId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('recipient_id', recipientId)
    .eq('read', false);

  if (error) throw error;
}

export async function deleteAllNotifications(recipientId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('recipient_id', recipientId);

  if (error) throw error;
}
