-- Add google_place_id column to places table
-- This allows us to deduplicate places based on Google Places API ID

alter table places add column if not exists google_place_id text;

-- Create index for fast lookups by google_place_id
create index if not exists places_google_place_id_idx on places(google_place_id);

-- Add unique constraint to prevent duplicate Google Place IDs
alter table places add constraint places_google_place_id_unique unique (google_place_id);
