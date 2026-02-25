-- Notification system improvements:
-- 1. Expand notification types (event_attendance, event_reminder, comment_reply)
-- 2. Add event_id and comment_id columns
-- 3. Fix RLS delete policy (allow recipient to delete)
-- 4. Create push_tokens table
-- 5. Create notification_preferences table
-- 6. Enable Supabase Realtime for notifications
-- 7. Add unique index for event_attendance notifications

-- 1. Expand notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('like', 'comment', 'follow', 'guide_like', 'guide_comment', 'event_attendance', 'event_reminder', 'comment_reply'));

-- 2. Add event_id and comment_id columns
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS comment_id uuid REFERENCES comments(id) ON DELETE CASCADE;

-- 3. Fix RLS delete policy — allow both actor and recipient to delete
DROP POLICY IF EXISTS "Users can delete own actor notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = actor_id OR auth.uid() = recipient_id);

-- 4. Push tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push tokens"
  ON push_tokens FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push tokens"
  ON push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push tokens"
  ON push_tokens FOR DELETE USING (auth.uid() = user_id);

-- 5. Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  push_enabled boolean NOT NULL DEFAULT true,
  likes boolean NOT NULL DEFAULT true,
  comments boolean NOT NULL DEFAULT true,
  follows boolean NOT NULL DEFAULT true,
  comment_replies boolean NOT NULL DEFAULT true,
  event_attendance boolean NOT NULL DEFAULT true,
  event_reminders boolean NOT NULL DEFAULT true,
  guide_likes boolean NOT NULL DEFAULT true,
  guide_comments boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- 6. Enable Supabase Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 7. Unique index for event_attendance notifications
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_event_attendance_unique
  ON notifications(actor_id, event_id, type) WHERE type = 'event_attendance';
