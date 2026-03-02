-- Cache Google Places rating data on the places table to avoid repeated API calls
ALTER TABLE places ADD COLUMN IF NOT EXISTS rating double precision;
ALTER TABLE places ADD COLUMN IF NOT EXISTS user_ratings_total integer;
ALTER TABLE places ADD COLUMN IF NOT EXISTS rating_fetched_at timestamptz;

-- Allow authenticated users to update rating columns
CREATE POLICY "Authenticated users can update place ratings"
  ON places FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
