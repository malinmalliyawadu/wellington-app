-- Points & Leveling System
-- Replaces the old badge-only achievement system with a points ledger,
-- cached totals, and redesigned badge definitions.

-- 1. Points ledger table
CREATE TABLE IF NOT EXISTS user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  points integer NOT NULL,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_points_user_id ON user_points(user_id);
CREATE INDEX idx_user_points_created_at ON user_points(user_id, created_at DESC);

-- 2. Cached totals table
CREATE TABLE IF NOT EXISTS user_point_totals (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  points_by_action jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. RLS policies
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_point_totals ENABLE ROW LEVEL SECURITY;

-- user_points: users can insert their own rows, read their own rows
CREATE POLICY "Users can insert own points" ON user_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

-- user_point_totals: users can upsert their own row, anyone can read (for profiles)
CREATE POLICY "Users can upsert own totals" ON user_point_totals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read totals" ON user_point_totals
  FOR SELECT USING (true);

-- 4. DB trigger: award 2 points to post author when a like is inserted
CREATE OR REPLACE FUNCTION award_like_points()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id uuid;
BEGIN
  -- Get the post author
  SELECT user_id INTO post_author_id FROM posts WHERE id = NEW.post_id;

  -- Don't award points for self-likes
  IF post_author_id IS NULL OR post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Insert point entry (bypasses RLS since this is a trigger function)
  INSERT INTO user_points (user_id, action_type, points, reference_id)
  VALUES (post_author_id, 'like_received', 2, NEW.post_id);

  -- Upsert totals
  INSERT INTO user_point_totals (user_id, total_points, level, points_by_action, updated_at)
  VALUES (
    post_author_id,
    2,
    1,
    jsonb_build_object('like_received', 2),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_point_totals.total_points + 2,
    points_by_action = jsonb_set(
      user_point_totals.points_by_action,
      '{like_received}',
      to_jsonb(COALESCE((user_point_totals.points_by_action->>'like_received')::int, 0) + 2)
    ),
    level = CASE
      WHEN user_point_totals.total_points + 2 >= 10000 THEN 10
      WHEN user_point_totals.total_points + 2 >= 6000 THEN 9
      WHEN user_point_totals.total_points + 2 >= 3500 THEN 8
      WHEN user_point_totals.total_points + 2 >= 2000 THEN 7
      WHEN user_point_totals.total_points + 2 >= 1200 THEN 6
      WHEN user_point_totals.total_points + 2 >= 700 THEN 5
      WHEN user_point_totals.total_points + 2 >= 350 THEN 4
      WHEN user_point_totals.total_points + 2 >= 150 THEN 3
      WHEN user_point_totals.total_points + 2 >= 50 THEN 2
      ELSE 1
    END,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_award_points
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION award_like_points();

-- 5. Backfill existing users: 10 points per exploration
INSERT INTO user_point_totals (user_id, total_points, level, points_by_action, updated_at)
SELECT
  user_id,
  COUNT(*) * 10,
  CASE
    WHEN COUNT(*) * 10 >= 10000 THEN 10
    WHEN COUNT(*) * 10 >= 6000 THEN 9
    WHEN COUNT(*) * 10 >= 3500 THEN 8
    WHEN COUNT(*) * 10 >= 2000 THEN 7
    WHEN COUNT(*) * 10 >= 1200 THEN 6
    WHEN COUNT(*) * 10 >= 700 THEN 5
    WHEN COUNT(*) * 10 >= 350 THEN 4
    WHEN COUNT(*) * 10 >= 150 THEN 3
    WHEN COUNT(*) * 10 >= 50 THEN 2
    ELSE 1
  END,
  jsonb_build_object('explore', COUNT(*) * 10),
  now()
FROM user_explorations
GROUP BY user_id
ON CONFLICT (user_id) DO NOTHING;

-- Also backfill ledger entries for existing explorations
INSERT INTO user_points (user_id, action_type, points, reference_id, created_at)
SELECT user_id, 'explore', 10, place_id, explored_at
FROM user_explorations
ON CONFLICT DO NOTHING;
