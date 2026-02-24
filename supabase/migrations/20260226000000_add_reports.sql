-- Reports table for content moderation
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('post', 'user', 'comment')),
  content_id uuid,
  reason text NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'other')),
  details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  admin_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate reports on the same content by the same user
CREATE UNIQUE INDEX reports_unique_post ON reports(reporter_id, content_type, content_id)
  WHERE content_type IN ('post', 'comment') AND content_id IS NOT NULL;
CREATE UNIQUE INDEX reports_unique_user ON reports(reporter_id, reported_user_id)
  WHERE content_type = 'user';

CREATE INDEX reports_status_idx ON reports(status);
CREATE INDEX reports_reported_user_idx ON reports(reported_user_id);

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports
CREATE POLICY "Users can create own reports"
  ON reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT TO authenticated
  USING (public.is_admin());

-- Admins can update reports (change status, add notes)
CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE TO authenticated
  USING (public.is_admin());

-- Admins can delete reports
CREATE POLICY "Admins can delete reports"
  ON reports FOR DELETE TO authenticated
  USING (public.is_admin());
