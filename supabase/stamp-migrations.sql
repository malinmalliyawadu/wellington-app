-- Mark all existing migrations as applied so supabase db push skips them.
-- Run this after schema.sql on a fresh database.

create schema if not exists supabase_migrations;

create table if not exists supabase_migrations.schema_migrations (
  version text not null primary key,
  statements text[],
  name text
);

insert into supabase_migrations.schema_migrations (version, name) values
  ('20260217000000', 'add_media_dimensions'),
  ('20260218000000', 'add_post_media'),
  ('20260218100000', 'allow_profile_self_insert'),
  ('20260218200000', 'add_onboarding_completed'),
  ('20260218300000', 'add_notifications'),
  ('20260218400000', 'add_follow_notifications'),
  ('20260219000000', 'add_event_categories_and_price'),
  ('20260219100000', 'add_trails'),
  ('20260220000000', 'add_trail_place_support'),
  ('20260220100000', 'add_saved_items'),
  ('20260221000000', 'add_instagram_connections'),
  ('20260221100000', 'add_profile_visibility'),
  ('20260221200000', 'scope_post_media_upload_policy')
on conflict (version) do nothing;
