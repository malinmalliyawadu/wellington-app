-- Exploration and Achievements Feature
-- Run this in the Supabase SQL Editor

-- Create exploration_method enum
create type exploration_method as enum ('viewed', 'posted');

-- Track which places users have explored
create table user_explorations (
  user_id uuid references profiles(id) on delete cascade not null,
  place_id uuid references places(id) on delete cascade not null,
  explored_at timestamptz not null default now(),
  exploration_method exploration_method not null,
  primary key (user_id, place_id)
);

create index idx_user_explorations_user_id on user_explorations(user_id);
create index idx_user_explorations_place_id on user_explorations(place_id);

-- Achievement definitions (seeded data)
create table achievement_definitions (
  id text primary key,
  type text not null check (type in ('category', 'milestone', 'neighborhood', 'social')),
  title text not null,
  description text not null,
  icon_name text not null,
  requirement jsonb not null,
  badge_color text not null,
  sort_order integer not null,
  created_at timestamptz not null default now()
);

create index idx_achievement_definitions_type on achievement_definitions(type);

-- Track user's unlocked achievements
create table user_achievements (
  user_id uuid references profiles(id) on delete cascade not null,
  achievement_id text references achievement_definitions(id) on delete cascade not null,
  unlocked_at timestamptz not null default now(),
  progress jsonb default '{}',
  primary key (user_id, achievement_id)
);

create index idx_user_achievements_user_id on user_achievements(user_id);

-- Row Level Security

-- User explorations: users can view and manage own explorations
alter table user_explorations enable row level security;

create policy "Users can view own explorations"
  on user_explorations for select using (auth.uid() = user_id);

create policy "Users can create own explorations"
  on user_explorations for insert with check (auth.uid() = user_id);

-- Achievement definitions: everyone can read
alter table achievement_definitions enable row level security;

create policy "Achievement definitions are viewable by everyone"
  on achievement_definitions for select using (true);

-- User achievements: users can view own achievements
alter table user_achievements enable row level security;

create policy "Users can view own achievements"
  on user_achievements for select using (auth.uid() = user_id);

create policy "Users can create own achievements"
  on user_achievements for insert with check (auth.uid() = user_id);
