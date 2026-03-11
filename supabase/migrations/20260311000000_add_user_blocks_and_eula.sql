-- Add EULA acceptance timestamp to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS eula_accepted_at timestamptz;

-- Create user_blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- RLS policies for user_blocks
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks
CREATE POLICY "Users can view own blocks"
  ON user_blocks FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Users can block others"
  ON user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock others
CREATE POLICY "Users can unblock others"
  ON user_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- When a user blocks someone, also unfollow in both directions
CREATE OR REPLACE FUNCTION handle_block_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove follow in both directions
  DELETE FROM follows WHERE follower_id = NEW.blocker_id AND following_id = NEW.blocked_id;
  DELETE FROM follows WHERE follower_id = NEW.blocked_id AND following_id = NEW.blocker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_block
  AFTER INSERT ON user_blocks
  FOR EACH ROW
  EXECUTE FUNCTION handle_block_cleanup();
