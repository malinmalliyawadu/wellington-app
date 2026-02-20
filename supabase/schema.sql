-- Wellington App Database Schema
-- Run this in the Supabase SQL Editor

-- Enums
create type place_category as enum ('cafe', 'restaurant', 'bar', 'attraction', 'park', 'venue', 'trail');
create type post_type as enum ('photo', 'video', 'text');
create type event_category as enum ('music', 'comedy', 'art', 'food', 'market', 'community', 'quiz', 'craft', 'kids', 'cultural');
create type trail_difficulty as enum ('easy', 'moderate', 'hard');

-- Profiles (linked to auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  avatar_url text not null default '',
  bio text,
  onboarding_completed boolean not null default false,
  profile_visibility text not null default 'public' check (profile_visibility in ('public', 'private')),
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
  google_place_id text unique,
  created_at timestamptz not null default now()
);

create index places_google_place_id_idx on places(google_place_id);

-- Posts
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  place_id uuid references places(id) on delete cascade not null,
  type post_type not null,
  content text not null,
  media_url text,
  thumbnail_url text,
  media_width integer,
  media_height integer,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

create index posts_user_id_idx on posts(user_id);
create index posts_place_id_idx on posts(place_id);
create index posts_created_at_idx on posts(created_at desc);

-- Post media (multi-media posts — up to 5 photos/videos per post)
create table post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  media_url text not null,
  thumbnail_url text,
  media_type text not null check (media_type in ('photo', 'video')),
  media_width integer,
  media_height integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index post_media_post_id_idx on post_media(post_id);

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
  price numeric(8,2),
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

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

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

-- Post media: anyone can read, post owner can insert/delete
alter table post_media enable row level security;

create policy "Anyone can view post media"
  on post_media for select using (true);

create policy "Post owner can insert media"
  on post_media for insert with check (
    exists (select 1 from posts where posts.id = post_id and posts.user_id = auth.uid())
  );

create policy "Post owner can delete media"
  on post_media for delete using (
    exists (select 1 from posts where posts.id = post_id and posts.user_id = auth.uid())
  );

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
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own post media"
  on storage.objects for delete using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Trails (linked to shadow place records for post/event support)
create table trails (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  elevation text not null,
  distance text not null,
  duration text not null,
  difficulty trail_difficulty not null,
  highlights jsonb not null default '[]',
  trailhead jsonb not null,
  coordinates jsonb not null default '[]',
  place_id uuid not null references places(id),
  created_at timestamptz not null default now(),
  constraint trails_place_id_unique unique (place_id)
);

alter table trails enable row level security;

create policy "trails_public_read" on trails
  for select using (true);

-- Saved/bookmarked items (posts, places, events)
create table if not exists saved_items (
  user_id uuid not null references profiles(id) on delete cascade,
  item_type text not null check (item_type in ('post', 'place', 'event')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

create index if not exists saved_items_user_idx on saved_items(user_id);
create index if not exists saved_items_user_type_idx on saved_items(user_id, item_type);

alter table saved_items enable row level security;

drop policy if exists "Users can view own saved items" on saved_items;
create policy "Users can view own saved items"
  on saved_items for select using (auth.uid() = user_id);

drop policy if exists "Users can save items" on saved_items;
create policy "Users can save items"
  on saved_items for insert with check (auth.uid() = user_id);

drop policy if exists "Users can unsave items" on saved_items;
create policy "Users can unsave items"
  on saved_items for delete using (auth.uid() = user_id);

-- Instagram connections for importing posts
create table if not exists instagram_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  instagram_user_id text not null,
  instagram_username text not null,
  access_token text not null,
  token_expires_at timestamptz not null,
  connected_at timestamptz not null default now(),
  constraint instagram_connections_user_unique unique (user_id),
  constraint instagram_connections_ig_unique unique (instagram_user_id)
);

alter table instagram_connections enable row level security;

drop policy if exists "Users can view own instagram connection" on instagram_connections;
create policy "Users can view own instagram connection"
  on instagram_connections for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own instagram connection" on instagram_connections;
create policy "Users can insert own instagram connection"
  on instagram_connections for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own instagram connection" on instagram_connections;
create policy "Users can update own instagram connection"
  on instagram_connections for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own instagram connection" on instagram_connections;
create policy "Users can delete own instagram connection"
  on instagram_connections for delete
  using (auth.uid() = user_id);
