-- Make post_id nullable to support follow notifications (which have no post)
ALTER TABLE notifications ALTER COLUMN post_id DROP NOT NULL;

-- Add 'follow' to the allowed types
ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('like', 'comment', 'follow'));

-- Unique index to prevent duplicate follow notifications
CREATE UNIQUE INDEX idx_notifications_follow_unique
  ON notifications(actor_id, recipient_id, type)
  WHERE type = 'follow';
