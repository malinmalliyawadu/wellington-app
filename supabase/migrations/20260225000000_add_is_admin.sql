-- Add is_admin flag to profiles
ALTER TABLE profiles ADD COLUMN is_admin boolean NOT NULL DEFAULT false;

-- Helper function for RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Admin RLS policies for trails
CREATE POLICY "Admins can insert trails"
  ON trails FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update trails"
  ON trails FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete trails"
  ON trails FOR DELETE TO authenticated
  USING (public.is_admin());

-- Admin RLS policies for places
CREATE POLICY "Admins can insert places"
  ON places FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update places"
  ON places FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete places"
  ON places FOR DELETE TO authenticated
  USING (public.is_admin());

-- Admin RLS policies for events
CREATE POLICY "Admins can insert events"
  ON events FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE TO authenticated
  USING (public.is_admin());

-- Admin RLS policies for posts (moderation)
CREATE POLICY "Admins can update posts"
  ON posts FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete posts"
  ON posts FOR DELETE TO authenticated
  USING (public.is_admin());
