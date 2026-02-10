-- Wellington App Seed Data
-- Run this AFTER schema.sql in the Supabase SQL Editor
--
-- IMPORTANT: Before running this script, you must create auth users
-- via the Supabase Admin API or Dashboard. The profiles are auto-created
-- by the on_auth_user_created trigger, but we override them below.
--
-- You can create test users via the Supabase Dashboard:
-- Authentication > Users > Add User (with the UUIDs below)
--
-- Or via the Admin API:
-- supabase.auth.admin.createUser({ id: '...', email: '...', password: '...' })

-- Predictable UUIDs for seed data
-- u1: 00000000-0000-0000-0000-000000000001  (current user / you)
-- u2: 00000000-0000-0000-0000-000000000002
-- u3: 00000000-0000-0000-0000-000000000003
-- u4: 00000000-0000-0000-0000-000000000004
-- u5: 00000000-0000-0000-0000-000000000005
-- u6: 00000000-0000-0000-0000-000000000006
-- u7: 00000000-0000-0000-0000-000000000007
-- u8: 00000000-0000-0000-0000-000000000008
-- u9: 00000000-0000-0000-0000-000000000009
-- u10: 00000000-0000-0000-0000-000000000010

-- ============================================================
-- PROFILES (upsert to override auto-created profiles)
-- ============================================================
INSERT INTO profiles (id, username, display_name, avatar_url, bio) VALUES
  ('00000000-0000-0000-0000-000000000001', 'you', 'You', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200', 'Wellington local. Coffee & gigs.'),
  ('00000000-0000-0000-0000-000000000002', 'sarah_eats_welly', 'Sarah Chen', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', 'Food blogger | Wellington eats & drinks'),
  ('00000000-0000-0000-0000-000000000003', 'artsy_jordan', 'Jordan Taylor', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', 'Photographer & art lover. Capturing Wellington.'),
  ('00000000-0000-0000-0000-000000000004', 'gig_queen_mel', 'Mel Rodriguez', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', 'Live music addict. If there is a gig, I am there.'),
  ('00000000-0000-0000-0000-000000000005', 'coffeesnob_nz', 'Alex Kim', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', 'Hunting the perfect flat white across Wellington'),
  ('00000000-0000-0000-0000-000000000006', 'welly_walks', 'Tane Mahuta', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', 'Trail runner & outdoor enthusiast'),
  ('00000000-0000-0000-0000-000000000007', 'craft_beer_sam', 'Sam O''Brien', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200', 'Craft beer nerd. Wellington is heaven.'),
  ('00000000-0000-0000-0000-000000000008', 'market_maya', 'Maya Patel', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', 'Market lover. Supporting local makers.'),
  ('00000000-0000-0000-0000-000000000009', 'night_owl_pete', 'Pete Williams', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200', 'Night owl. Late-night Wellington is the best Wellington.'),
  ('00000000-0000-0000-0000-000000000010', 'comedy_kate', 'Kate Nguyen', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', 'Stand-up comedy obsessed. Wellington funny bone.')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio;

-- ============================================================
-- PLACES (22 Wellington places)
-- ============================================================
INSERT INTO places (id, name, category, address, latitude, longitude) VALUES
  -- Cafes
  ('10000000-0000-0000-0000-000000000001', 'Flight Coffee', 'cafe', '14 Dixon Street, Te Aro', -41.2910, 174.7753),
  ('10000000-0000-0000-0000-000000000002', 'Customs by Coffee Supreme', 'cafe', '39 Ghuznee Street, Te Aro', -41.2922, 174.7736),
  ('10000000-0000-0000-0000-000000000003', 'Loretta', 'cafe', '181 Cuba Street, Te Aro', -41.2952, 174.7739),
  ('10000000-0000-0000-0000-000000000004', 'Hillside Kitchen & Cellar', 'cafe', '241 Tinakori Road, Thorndon', -41.2730, 174.7710),
  ('10000000-0000-0000-0000-000000000005', 'Prefab Eatery', 'cafe', '14 Jessie Street, Te Aro', -41.2935, 174.7758),
  -- Restaurants
  ('10000000-0000-0000-0000-000000000006', 'Hiakai', 'restaurant', '90 Tory Street, Te Aro', -41.2942, 174.7785),
  ('10000000-0000-0000-0000-000000000007', 'Egmont Street Deli', 'restaurant', '12 Egmont Street, Te Aro', -41.2905, 174.7752),
  ('10000000-0000-0000-0000-000000000008', 'Aunty Mena''s', 'restaurant', '167 Cuba Street, Te Aro', -41.2947, 174.7740),
  -- Bars
  ('10000000-0000-0000-0000-000000000009', 'Hashigo Zake', 'bar', '25 Taranaki Street, Te Aro', -41.2912, 174.7758),
  ('10000000-0000-0000-0000-000000000010', 'Golding''s Free Dive', 'bar', '14 Leeds Street, Te Aro', -41.2920, 174.7748),
  ('10000000-0000-0000-0000-000000000011', 'The Library', 'bar', '53 Courtenay Place, Te Aro', -41.2935, 174.7795),
  ('10000000-0000-0000-0000-000000000012', 'Rogue & Vagabond', 'bar', '18 Garrett Street, Te Aro', -41.2932, 174.7788),
  -- Attractions
  ('10000000-0000-0000-0000-000000000013', 'Te Papa Museum', 'attraction', '55 Cable Street, Wellington', -41.2907, 174.7822),
  ('10000000-0000-0000-0000-000000000014', 'Wellington Cable Car', 'attraction', '280 Lambton Quay, Wellington', -41.2843, 174.7706),
  ('10000000-0000-0000-0000-000000000015', 'Zealandia', 'attraction', '53 Waiapu Road, Karori', -41.2900, 174.7530),
  -- Parks
  ('10000000-0000-0000-0000-000000000016', 'Wellington Botanic Garden', 'park', '101 Glenmore Street, Kelburn', -41.2810, 174.7690),
  ('10000000-0000-0000-0000-000000000017', 'Mt Victoria Lookout', 'park', 'Lookout Road, Mt Victoria', -41.2960, 174.7900),
  ('10000000-0000-0000-0000-000000000018', 'Oriental Bay', 'park', 'Oriental Parade, Wellington', -41.2880, 174.7880),
  -- Venues
  ('10000000-0000-0000-0000-000000000019', 'San Fran', 'venue', '171 Cuba Street, Te Aro', -41.2949, 174.7739),
  ('10000000-0000-0000-0000-000000000020', 'Meow', 'venue', '9 Edward Street, Te Aro', -41.2920, 174.7760),
  ('10000000-0000-0000-0000-000000000021', 'Valhalla', 'venue', '134 Vivian Street, Te Aro', -41.2955, 174.7752),
  ('10000000-0000-0000-0000-000000000022', 'BATS Theatre', 'venue', '1 Kent Terrace, Mt Victoria', -41.2940, 174.7830);

-- ============================================================
-- POSTS (selected subset — 20 posts for seed data)
-- ============================================================
INSERT INTO posts (id, user_id, place_id, type, content, media_url, likes, created_at) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'photo',
   'Flight Coffee never misses. Their single origin pour-over is consistently the best in town.',
   'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600', 12, '2025-01-28T09:00:00Z'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000009', 'photo',
   'Hashigo Zake has the best craft beer selection in Wellington. 24 taps of pure happiness.',
   'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600', 8, '2025-01-28T18:00:00Z'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000013', 'photo',
   'The new exhibition at Te Papa is absolutely stunning. Free entry and world-class art.',
   'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=600', 15, '2025-01-27T14:00:00Z'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000017', 'photo',
   'Sunrise from Mt Vic this morning. Wellington at its best. Worth the early alarm!',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', 22, '2025-01-26T06:30:00Z'),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'photo',
   'Customs doing what Customs does best. This flat white is perfection.',
   'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600', 9, '2025-01-28T08:00:00Z'),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000019', 'photo',
   'San Fran last night was absolutely electric. What a lineup!',
   'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600', 18, '2025-01-29T00:00:00Z'),
  ('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'photo',
   'Loretta brunch is always a vibe. The lamb shoulder is insane.',
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', 14, '2025-01-28T11:00:00Z'),
  ('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000016', 'photo',
   'The roses in the Botanic Garden are incredible this time of year.',
   'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=600', 11, '2025-01-25T15:00:00Z'),
  ('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000021', 'photo',
   'Valhalla doom night. Walls were shaking. Ears still ringing.',
   'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600', 7, '2025-01-28T23:00:00Z'),
  ('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000010', 'photo',
   'Golding''s Free Dive is such a hidden gem. Pizza and craft beer in a laneway.',
   'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600', 10, '2025-01-27T19:00:00Z'),
  ('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000017', 'photo',
   'Golden hour from Mt Vic never gets old. This city is beautiful.',
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600', 20, '2025-01-27T19:00:00Z'),
  ('20000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'photo',
   'Prefab on a sunny morning. This courtyard is perfection.',
   'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600', 6, '2025-01-26T10:00:00Z'),
  ('20000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000020', 'photo',
   'Meow is the GOAT venue. Intimate but the sound is always dialled in.',
   'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600', 13, '2025-01-28T22:00:00Z'),
  ('20000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 'photo',
   'Hiakai is doing incredible things with indigenous NZ ingredients. A must-try.',
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600', 16, '2025-01-25T20:00:00Z'),
  ('20000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000011', 'photo',
   'The Library cocktails are next level. Try the Old Fashioned.',
   'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600', 9, '2025-01-26T21:00:00Z'),
  ('20000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000018', 'photo',
   'Evening swim at Oriental Bay. Summer in Wellington is perfection.',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', 17, '2025-01-24T18:00:00Z'),
  ('20000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000022', 'photo',
   'BATS Theatre is such a treasure. Tiny but mighty.',
   'https://images.unsplash.com/photo-1503095396549-807759245b35?w=600', 8, '2025-01-20T22:00:00Z'),
  ('20000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000012', 'photo',
   'Rogue & Vagabond garden sessions are so good in summer.',
   'https://images.unsplash.com/photo-1575037614876-c38a4b44571d?w=600', 11, '2025-01-26T16:00:00Z'),
  ('20000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000015', 'photo',
   'Zealandia at dawn. Heard a kiwi call for the first time!',
   'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=600', 19, '2025-01-23T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', 'text',
   'Aunty Mena''s is the best vegetarian food in Wellington. The hot sauce is seriously next level. Go hungry.',
   null, 7, '2025-01-24T13:00:00Z');

-- ============================================================
-- COMMENTS (selected subset)
-- ============================================================
INSERT INTO comments (id, post_id, user_id, text, created_at) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Their Ethiopian single origin is unreal right now', '2025-01-28T10:00:00Z'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Best pour-over in town for sure', '2025-01-28T11:00:00Z'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Such a powerful exhibition. Everyone should see it.', '2025-01-27T16:00:00Z'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Free entry is amazing for something this good', '2025-01-27T17:00:00Z'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Went last week, was blown away', '2025-01-27T18:00:00Z'),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Sunset from the top is unreal!', '2025-01-26T18:00:00Z'),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'One of my favourite Wellington walks', '2025-01-26T19:30:00Z'),
  ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000009', 'Wellington music scene is the best in NZ, no contest', '2025-01-29T08:00:00Z'),
  ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Loretta lamb shoulder is top 3 dishes in Wellington for me', '2025-01-28T21:00:00Z'),
  ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004', 'Wish I was there! Doom metal at Valhalla is always heavy.', '2025-01-28T23:30:00Z'),
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004', 'Best date spot in Welly for sure', '2025-01-27T20:00:00Z'),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000007', 'This photo is stunning. What camera are you using?', '2025-01-27T20:00:00Z'),
  ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Golden hour from Mt Vic never gets old', '2025-01-27T20:30:00Z'),
  ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Need to try this. Been on my list forever.', '2025-01-25T21:00:00Z'),
  ('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000003', 'The garden sessions are so good in summer!', '2025-01-26T17:00:00Z');

-- ============================================================
-- FOLLOWS (u1 follows u2 and u3)
-- ============================================================
INSERT INTO follows (follower_id, following_id) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003');

-- ============================================================
-- POST LIKES (a few likes for seed posts)
-- Note: The trigger will auto-update the denormalized likes count,
-- but since we set likes directly above, we should be careful.
-- These inserts will INCREMENT the counts, so the final like count
-- will be initial + number of rows here. For simplicity, we skip
-- this section — the posts already have likes set directly.
-- ============================================================

-- ============================================================
-- EVENTS (10 upcoming events — set dates in the future)
-- ============================================================
INSERT INTO events (id, title, description, place_id, date, start_time, end_time, image_url, category) VALUES
  ('40000000-0000-0000-0000-000000000001', 'Friday Night Jazz', 'Live jazz trio performing standards and originals. Perfect way to kick off the weekend.',
   '10000000-0000-0000-0000-000000000019', CURRENT_DATE + INTERVAL '3 days', '20:00', '23:00',
   'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600', 'music'),
  ('40000000-0000-0000-0000-000000000002', 'Wellington Comedy Night', 'Five of Wellington''s best comedians battle it out. Hosted by Kate Nguyen.',
   '10000000-0000-0000-0000-000000000019', CURRENT_DATE + INTERVAL '5 days', '19:30', '22:00',
   'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=600', 'comedy'),
  ('40000000-0000-0000-0000-000000000003', 'Harbourside Market', 'Fresh produce, artisan goods, street food. Every Sunday morning.',
   '10000000-0000-0000-0000-000000000018', CURRENT_DATE + INTERVAL '7 days', '07:30', '14:00',
   'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600', 'market'),
  ('40000000-0000-0000-0000-000000000004', 'Garage Project Tap Takeover', 'Garage Project takes over all 24 taps at Hashigo Zake. Special releases and one-offs.',
   '10000000-0000-0000-0000-000000000009', CURRENT_DATE + INTERVAL '10 days', '17:00', '23:00',
   'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600', 'food'),
  ('40000000-0000-0000-0000-000000000005', 'Mt Vic Moonlight Walk', 'Guided night walk up Mt Victoria. Bring a torch and warm layers.',
   '10000000-0000-0000-0000-000000000017', CURRENT_DATE + INTERVAL '12 days', '20:00', '22:00',
   'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=600', 'community'),
  ('40000000-0000-0000-0000-000000000006', 'Punk Showcase', 'Four local punk bands. $10 door. All ages.',
   '10000000-0000-0000-0000-000000000021', CURRENT_DATE + INTERVAL '4 days', '19:00', '23:30',
   'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600', 'music'),
  ('40000000-0000-0000-0000-000000000007', 'New Zealand Art Exhibition', 'Contemporary NZ artists explore identity and place. Free entry.',
   '10000000-0000-0000-0000-000000000013', CURRENT_DATE + INTERVAL '14 days', '10:00', '17:00',
   'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=600', 'art'),
  ('40000000-0000-0000-0000-000000000008', 'Electronic Night at Meow', 'DJs spinning house, techno, and drum & bass until late.',
   '10000000-0000-0000-0000-000000000020', CURRENT_DATE + INTERVAL '6 days', '22:00', null,
   'https://images.unsplash.com/photo-1571266028243-d220d067bacc?w=600', 'music'),
  ('40000000-0000-0000-0000-000000000009', 'BATS Theatre: One-Act Festival', 'Short plays from emerging Wellington playwrights. Three nights only.',
   '10000000-0000-0000-0000-000000000022', CURRENT_DATE + INTERVAL '8 days', '19:00', '21:30',
   'https://images.unsplash.com/photo-1503095396549-807759245b35?w=600', 'art'),
  ('40000000-0000-0000-0000-000000000010', 'Botanic Garden Guided Tour', 'Expert-led tour of the heritage rose garden and native bush.',
   '10000000-0000-0000-0000-000000000016', CURRENT_DATE + INTERVAL '9 days', '10:00', '12:00',
   'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=600', 'community');

-- ============================================================
-- EVENT ATTENDEES
-- ============================================================
INSERT INTO event_attendees (event_id, user_id) VALUES
  -- Friday Night Jazz
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004'),
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000009'),
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  -- Comedy Night
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010'),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004'),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000009'),
  -- Harbourside Market
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000008'),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005'),
  -- Garage Project Tap Takeover
  ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000007'),
  ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000009'),
  ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004'),
  -- Punk Showcase
  ('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000004'),
  ('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000009'),
  ('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006'),
  -- Electronic Night at Meow
  ('40000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000009'),
  ('40000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000004'),
  -- BATS Theatre
  ('40000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000010'),
  ('40000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003'),
  -- Botanic Garden Tour
  ('40000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000006'),
  ('40000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003'),
  ('40000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000008');
