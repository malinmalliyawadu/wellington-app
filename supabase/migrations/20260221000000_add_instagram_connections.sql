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

-- RLS: users can only access their own connection
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
