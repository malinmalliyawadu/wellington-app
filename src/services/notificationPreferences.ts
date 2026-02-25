import { supabase } from '../lib/supabase';

export interface NotificationPreferences {
  pushEnabled: boolean;
  likes: boolean;
  comments: boolean;
  follows: boolean;
  commentReplies: boolean;
  eventAttendance: boolean;
  eventReminders: boolean;
  guideLikes: boolean;
  guideComments: boolean;
}

const DEFAULTS: NotificationPreferences = {
  pushEnabled: true,
  likes: true,
  comments: true,
  follows: true,
  commentReplies: true,
  eventAttendance: true,
  eventReminders: true,
  guideLikes: true,
  guideComments: true,
};

function mapRow(row: any): NotificationPreferences {
  return {
    pushEnabled: row.push_enabled ?? true,
    likes: row.likes ?? true,
    comments: row.comments ?? true,
    follows: row.follows ?? true,
    commentReplies: row.comment_replies ?? true,
    eventAttendance: row.event_attendance ?? true,
    eventReminders: row.event_reminders ?? true,
    guideLikes: row.guide_likes ?? true,
    guideComments: row.guide_comments ?? true,
  };
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return DEFAULTS;
  return mapRow(data);
}

export async function updateNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreferences>,
): Promise<void> {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        updated_at: new Date().toISOString(),
        ...(prefs.pushEnabled !== undefined && { push_enabled: prefs.pushEnabled }),
        ...(prefs.likes !== undefined && { likes: prefs.likes }),
        ...(prefs.comments !== undefined && { comments: prefs.comments }),
        ...(prefs.follows !== undefined && { follows: prefs.follows }),
        ...(prefs.commentReplies !== undefined && { comment_replies: prefs.commentReplies }),
        ...(prefs.eventAttendance !== undefined && { event_attendance: prefs.eventAttendance }),
        ...(prefs.eventReminders !== undefined && { event_reminders: prefs.eventReminders }),
        ...(prefs.guideLikes !== undefined && { guide_likes: prefs.guideLikes }),
        ...(prefs.guideComments !== undefined && { guide_comments: prefs.guideComments }),
      },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
}
