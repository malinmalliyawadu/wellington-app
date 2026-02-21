-- Guides: curated lists of places created by users
create table guides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index guides_user_id_idx on guides(user_id);
create index guides_created_at_idx on guides(created_at desc);

-- Guide places (join table)
create table guide_places (
  guide_id uuid not null references guides(id) on delete cascade,
  place_id uuid not null references places(id) on delete cascade,
  sort_order integer not null default 0,
  note text,
  added_at timestamptz not null default now(),
  primary key (guide_id, place_id)
);

create index guide_places_guide_id_idx on guide_places(guide_id);

-- RLS: guides
alter table guides enable row level security;

create policy "Guides are viewable by everyone"
  on guides for select using (true);

create policy "Users can create own guides"
  on guides for insert with check (auth.uid() = user_id);

create policy "Users can update own guides"
  on guides for update using (auth.uid() = user_id);

create policy "Users can delete own guides"
  on guides for delete using (auth.uid() = user_id);

-- RLS: guide_places
alter table guide_places enable row level security;

create policy "Guide places are viewable by everyone"
  on guide_places for select using (true);

create policy "Guide owner can add places"
  on guide_places for insert with check (
    exists (select 1 from guides where guides.id = guide_id and guides.user_id = auth.uid())
  );

create policy "Guide owner can update places"
  on guide_places for update using (
    exists (select 1 from guides where guides.id = guide_id and guides.user_id = auth.uid())
  );

create policy "Guide owner can remove places"
  on guide_places for delete using (
    exists (select 1 from guides where guides.id = guide_id and guides.user_id = auth.uid())
  );

-- Extend saved_items to allow 'guide' type
alter table saved_items drop constraint if exists saved_items_item_type_check;
alter table saved_items add constraint saved_items_item_type_check
  check (item_type in ('post', 'place', 'event', 'guide'));
