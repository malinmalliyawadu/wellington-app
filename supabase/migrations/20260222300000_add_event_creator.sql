-- Add creator_id to events table
ALTER TABLE events ADD COLUMN creator_id uuid REFERENCES profiles(id);

-- RLS policies for event owners
CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  USING (auth.uid() = creator_id);
