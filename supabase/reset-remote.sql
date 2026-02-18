-- Drop all app tables (in dependency order) and types
-- Note: storage bucket must be managed via Supabase Dashboard or Storage API

DROP POLICY IF EXISTS "Users can delete own post media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload post media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post media" ON storage.objects;

DROP TABLE IF EXISTS post_media CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS event_attendees CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS places CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP FUNCTION IF EXISTS public.update_post_likes_count() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

DROP TYPE IF EXISTS place_category CASCADE;
DROP TYPE IF EXISTS post_type CASCADE;
DROP TYPE IF EXISTS event_category CASCADE;
