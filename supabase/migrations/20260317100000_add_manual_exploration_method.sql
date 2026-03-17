-- Add 'manual' exploration method for user-initiated place tick-offs
ALTER TYPE exploration_method ADD VALUE 'manual';

-- Allow users to un-mark places as visited (delete their own explorations)
CREATE POLICY "Users can delete own explorations"
  ON user_explorations FOR DELETE
  USING (auth.uid() = user_id);
