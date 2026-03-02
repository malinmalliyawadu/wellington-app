-- Add Eventfinda integration columns for deduplication and linking
ALTER TABLE events ADD COLUMN eventfinda_id integer UNIQUE;
ALTER TABLE events ADD COLUMN eventfinda_url text;

-- Partial index for efficient lookups on synced events
CREATE INDEX events_eventfinda_id_idx ON events(eventfinda_id) WHERE eventfinda_id IS NOT NULL;

-- RLS: allow service role to upsert events (edge function uses service role key,
-- which bypasses RLS by default, so no policy changes needed)
