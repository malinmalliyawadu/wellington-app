-- Add social media link columns to profiles
alter table profiles
  add column instagram_username text,
  add column tiktok_username text,
  add column x_username text;
