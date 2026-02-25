import { supabase } from '../lib/supabase';

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'guide_like'
  | 'guide_comment'
  | 'event_attendance'
  | 'event_reminder'
  | 'comment_reply'
  | 'mention';

export interface Notification {
  id: string;
  recipientId: string;
  actorId: string;
  type: NotificationType;
  postId: string | null;
  guideId: string | null;
  eventId: string | null;
  commentId: string | null;
  read: boolean;
  createdAt: string;
}

export function mapRow(row: any): Notification {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    actorId: row.actor_id,
    type: row.type,
    postId: row.post_id ?? null,
    guideId: row.guide_id ?? null,
    eventId: row.event_id ?? null,
    commentId: row.comment_id ?? null,
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

export async function createGuideLikeNotification(actorId: string, guideId: string): Promise<void> {
  const { data: guide, error: guideError } = await supabase
    .from('guides')
    .select('user_id')
    .eq('id', guideId)
    .single();

  if (guideError || !guide) return;
  if (guide.user_id === actorId) return;

  const { error } = await supabase
    .from('notifications')
    .insert({
      recipient_id: guide.user_id,
      actor_id: actorId,
      type: 'guide_like' as const,
      guide_id: guideId,
    });

  if (error && error.code !== '23505') throw error;
}

export async function deleteNotificationForGuideLike(actorId: string, guideId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('actor_id', actorId)
    .eq('guide_id', guideId)
    .eq('type', 'guide_like');

  if (error) throw error;
}

export async function createGuideCommentNotification(actorId: string, guideId: string): Promise<void> {
  const { data: guide, error: guideError } = await supabase
    .from('guides')
    .select('user_id')
    .eq('id', guideId)
    .single();

  if (guideError || !guide) return;
  if (guide.user_id === actorId) return;

  const { error } = await supabase
    .from('notifications')
    .insert({
      recipient_id: guide.user_id,
      actor_id: actorId,
      type: 'guide_comment' as const,
      guide_id: guideId,
    });

  if (error) {
    console.error('createGuideCommentNotification error:', error);
    throw error;
  }
}

export async function createEventAttendanceNotification(actorId: string, eventId: string): Promise<void> {
  // Look up the event creator
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('creator_id')
    .eq('id', eventId)
    .single();

  if (eventError || !event || !event.creator_id) return;

  // Don't notify yourself
  if (event.creator_id === actorId) return;

  const { error } = await supabase
    .from('notifications')
    .insert({
      recipient_id: event.creator_id,
      actor_id: actorId,
      type: 'event_attendance' as const,
      event_id: eventId,
    });

  // Ignore unique violation (duplicate attendance notification)
  if (error && error.code !== '23505') throw error;
}

export async function deleteNotificationForEventAttendance(actorId: string, eventId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('actor_id', actorId)
    .eq('event_id', eventId)
    .eq('type', 'event_attendance');

  if (error) throw error;
}

export async function createCommentReplyNotification(
  actorId: string,
  parentCommentUserId: string,
  postId: string,
  commentId: string,
): Promise<void> {
  // Don't notify yourself
  if (parentCommentUserId === actorId) return;

  const { error } = await supabase
    .from('notifications')
    .insert({
      recipient_id: parentCommentUserId,
      actor_id: actorId,
      type: 'comment_reply' as const,
      post_id: postId,
      comment_id: commentId,
    });

  if (error) {
    console.error('createCommentReplyNotification error:', error);
    throw error;
  }
}

export async function createMentionNotification(
  actorId: string,
  mentionedUserId: string,
  postId: string,
): Promise<void> {
  // Don't notify yourself
  if (mentionedUserId === actorId) return;

  const { error } = await supabase
    .from('notifications')
    .insert({
      recipient_id: mentionedUserId,
      actor_id: actorId,
      type: 'mention' as any,
      post_id: postId,
    });

  // Ignore unique violation (duplicate mention notification)
  if (error && error.code !== '23505') throw error;
}
