-- Add media dimension columns to posts table
alter table posts add column if not exists media_width integer;
alter table posts add column if not exists media_height integer;
