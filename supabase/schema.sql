-- Wellington App Database Schema
-- Run this in the Supabase SQL Editor

-- Enums
create type place_category as enum ('cafe', 'restaurant', 'bar', 'attraction', 'park', 'venue');
create type post_type as enum ('photo', 'video', 'text');
create type event_category as enum ('music', 'comedy', 'art', 'food', 'market', 'community');

-- Profiles (linked to auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  avatar_url text not null default '',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || left(new.id::text, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Places
create table places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category place_category not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now()
);

-- Posts
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  place_id uuid references places(id) on delete cascade not null,
  type post_type not null,
  content text not null,
  media_url text,
  thumbnail_url text,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

create index posts_user_id_idx on posts(user_id);
create index posts_place_id_idx on posts(place_id);
create index posts_created_at_idx on posts(created_at desc);

-- Events
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  place_id uuid references places(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time,
  image_url text,
  category event_category not null,
  ticket_url text,
  created_at timestamptz not null default now()
);

create index events_date_idx on events(date);

-- Event attendees (join table)
create table event_attendees (
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamptz not null default now()
);

create index comments_post_id_idx on comments(post_id);

-- Follows
create table follows (
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

create index follows_follower_idx on follows(follower_id);
create index follows_following_idx on follows(following_id);

-- Post likes (join table)
create table post_likes (
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_likes_user_idx on post_likes(user_id);

-- Trigger to update denormalized likes count on posts
create or replace function public.update_post_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set likes = likes + 1 where id = NEW.post_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update posts set likes = likes - 1 where id = OLD.post_id;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_post_like_change
  after insert or delete on post_likes
  for each row execute function public.update_post_likes_count();

-- Row Level Security

-- Profiles: anyone can read, users can update own
alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Places: anyone can read, authenticated users can insert
alter table places enable row level security;

create policy "Places are viewable by everyone"
  on places for select using (true);

create policy "Authenticated users can create places"
  on places for insert with check (auth.role() = 'authenticated');

-- Posts: anyone can read, users can CRUD own
alter table posts enable row level security;

create policy "Posts are viewable by everyone"
  on posts for select using (true);

create policy "Users can create own posts"
  on posts for insert with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on posts for update using (auth.uid() = user_id);

create policy "Users can delete own posts"
  on posts for delete using (auth.uid() = user_id);

-- Events: anyone can read, authenticated users can insert
alter table events enable row level security;

create policy "Events are viewable by everyone"
  on events for select using (true);

create policy "Authenticated users can create events"
  on events for insert with check (auth.role() = 'authenticated');

-- Event attendees: anyone can read, users can manage own attendance
alter table event_attendees enable row level security;

create policy "Event attendees are viewable by everyone"
  on event_attendees for select using (true);

create policy "Users can attend events"
  on event_attendees for insert with check (auth.uid() = user_id);

create policy "Users can leave events"
  on event_attendees for delete using (auth.uid() = user_id);

-- Comments: anyone can read, users can CRUD own
alter table comments enable row level security;

create policy "Comments are viewable by everyone"
  on comments for select using (true);

create policy "Users can create own comments"
  on comments for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on comments for delete using (auth.uid() = user_id);

-- Follows: anyone can read, users can manage own follows
alter table follows enable row level security;

create policy "Follows are viewable by everyone"
  on follows for select using (true);

create policy "Users can follow others"
  on follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow others"
  on follows for delete using (auth.uid() = follower_id);

-- Post likes: anyone can read, users can manage own likes
alter table post_likes enable row level security;

create policy "Post likes are viewable by everyone"
  on post_likes for select using (true);

create policy "Users can like posts"
  on post_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike posts"
  on post_likes for delete using (auth.uid() = user_id);

-- Storage bucket for post media
insert into storage.buckets (id, name, public) values ('post-media', 'post-media', true)
on conflict (id) do nothing;

create policy "Anyone can view post media"
  on storage.objects for select using (bucket_id = 'post-media');

create policy "Authenticated users can upload post media"
  on storage.objects for insert with check (
    bucket_id = 'post-media'
    and auth.role() = 'authenticated'
  );

create policy "Users can delete own post media"
  on storage.objects for delete using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
