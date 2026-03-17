-- Not interested items (events, places)
-- Allows users to hide events and places from their feed, map, and events views
CREATE TABLE IF NOT EXISTS not_interested (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('event', 'place')),
  item_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS not_interested_user_idx ON not_interested(user_id);
CREATE INDEX IF NOT EXISTS not_interested_user_type_idx ON not_interested(user_id, item_type);

ALTER TABLE not_interested ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own not interested items"
  ON not_interested FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark items as not interested"
  ON not_interested FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove not interested items"
  ON not_interested FOR DELETE
  USING (auth.uid() = user_id);
