-- Add likes column to guides
alter table guides add column if not exists likes integer not null default 0;

-- Guide likes (join table) — mirrors post_likes
create table guide_likes (
  guide_id uuid not null references guides(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (guide_id, user_id)
);

create index guide_likes_user_idx on guide_likes(user_id);

-- Trigger to keep denormalized likes count in sync
create or replace function public.update_guide_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update guides set likes = likes + 1 where id = NEW.guide_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update guides set likes = likes - 1 where id = OLD.guide_id;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_guide_like_change
  after insert or delete on guide_likes
  for each row execute function public.update_guide_likes_count();

-- RLS: guide_likes
alter table guide_likes enable row level security;

create policy "Guide likes are viewable by everyone"
  on guide_likes for select using (true);

create policy "Users can like guides"
  on guide_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike guides"
  on guide_likes for delete using (auth.uid() = user_id);

-- Guide comments — mirrors comments
create table guide_comments (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references guides(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create index guide_comments_guide_id_idx on guide_comments(guide_id);

-- RLS: guide_comments
alter table guide_comments enable row level security;

create policy "Guide comments are viewable by everyone"
  on guide_comments for select using (true);

create policy "Users can create own guide comments"
  on guide_comments for insert with check (auth.uid() = user_id);

create policy "Users can delete own guide comments"
  on guide_comments for delete using (auth.uid() = user_id);

create policy "Users can update own guide comments"
  on guide_comments for update using (auth.uid() = user_id);

-- Expand notification type to include guide_like and guide_comment
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('like', 'comment', 'follow', 'guide_like', 'guide_comment'));

-- Add nullable guide_id to notifications
alter table notifications add column if not exists guide_id uuid references guides(id) on delete cascade;

-- Unique index for guide like notifications (prevent duplicates)
create unique index if not exists idx_notifications_guide_like_unique
  on notifications(actor_id, guide_id, type) where type = 'guide_like';
