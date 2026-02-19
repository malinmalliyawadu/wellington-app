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

-- RLS: users can only see/manage their own saved items
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
