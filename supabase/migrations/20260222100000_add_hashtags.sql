-- Add hashtags support: canonical tag storage and post-hashtag join table

-- Canonical hashtag storage (lowercase, no #)
CREATE TABLE hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hashtags_name ON hashtags(name);
CREATE INDEX idx_hashtags_post_count ON hashtags(post_count DESC);

ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hashtags"
  ON hashtags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert hashtags"
  ON hashtags FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Post-hashtag join table
CREATE TABLE post_hashtags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, hashtag_id)
);

CREATE INDEX idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id);
CREATE INDEX idx_post_hashtags_post_id ON post_hashtags(post_id);

ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post hashtags"
  ON post_hashtags FOR SELECT
  USING (true);

CREATE POLICY "Post owner can insert post hashtags"
  ON post_hashtags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_id AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Post owner can delete post hashtags"
  ON post_hashtags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_id AND posts.user_id = auth.uid()
    )
  );

-- Trigger to maintain hashtags.post_count
CREATE OR REPLACE FUNCTION update_hashtag_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE hashtags SET post_count = post_count + 1 WHERE id = NEW.hashtag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE hashtags SET post_count = post_count - 1 WHERE id = OLD.hashtag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_hashtag_change
  AFTER INSERT OR DELETE ON post_hashtags
  FOR EACH ROW EXECUTE FUNCTION update_hashtag_post_count();
