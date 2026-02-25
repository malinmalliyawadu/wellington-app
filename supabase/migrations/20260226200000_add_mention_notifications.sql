-- Add 'mention' to the notifications type check constraint
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('like', 'comment', 'follow', 'guide_like', 'guide_comment', 'event_attendance', 'event_reminder', 'comment_reply', 'mention'));

-- Add mentions column to notification_preferences
alter table notification_preferences add column if not exists mentions boolean not null default true;
