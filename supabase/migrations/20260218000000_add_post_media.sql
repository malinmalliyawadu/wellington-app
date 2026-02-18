-- Add post_media table for multi-media posts (up to 5 photos/videos per post)

CREATE TABLE post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  media_width INTEGER,
  media_height INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_media_post_id ON post_media(post_id);

-- RLS policies
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post media"
  ON post_media FOR SELECT
  USING (true);

CREATE POLICY "Post owner can insert media"
  ON post_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_id AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Post owner can delete media"
  ON post_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_id AND posts.user_id = auth.uid()
    )
  );
