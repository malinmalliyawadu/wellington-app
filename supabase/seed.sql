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
--
-- NOTE: All post, comment, and event dates are dynamic (relative to CURRENT_DATE)
-- so the seed data always looks fresh.

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
-- Clear existing data (in dependency order) before re-seeding
-- ============================================================
DELETE FROM comments;
DELETE FROM post_likes;
DELETE FROM posts; -- cascades to post_media via ON DELETE CASCADE
DELETE FROM event_attendees;
DELETE FROM events;
DELETE FROM places;

-- ============================================================
-- PLACES (50 Wellington places)
-- ============================================================
INSERT INTO places (id, name, category, address, latitude, longitude) VALUES
  -- Cafes
  ('10000000-0000-0000-0000-000000000001', 'Flight Coffee', 'cafe', '14 Dixon Street, Te Aro', -41.2910, 174.7753),
  ('10000000-0000-0000-0000-000000000002', 'Customs by Coffee Supreme', 'cafe', '39 Ghuznee Street, Te Aro', -41.2922, 174.7736),
  ('10000000-0000-0000-0000-000000000003', 'Loretta', 'cafe', '181 Cuba Street, Te Aro', -41.2952, 174.7739),
  ('10000000-0000-0000-0000-000000000004', 'Hillside Kitchen & Cellar', 'cafe', '241 Tinakori Road, Thorndon', -41.2730, 174.7710),
  ('10000000-0000-0000-0000-000000000005', 'Prefab Eatery', 'cafe', '14 Jessie Street, Te Aro', -41.2935, 174.7758),
  ('10000000-0000-0000-0000-000000000023', 'Peoples Coffee', 'cafe', '5 Constable Street, Newtown', -41.3045, 174.7790),
  ('10000000-0000-0000-0000-000000000024', 'Lamason Brew Bar', 'cafe', '7 College Street, Te Aro', -41.2898, 174.7748),
  ('10000000-0000-0000-0000-000000000025', 'Raglan Roast', 'cafe', '32 Dixon Street, Te Aro', -41.2912, 174.7742),
  ('10000000-0000-0000-0000-000000000026', 'Mojo Coffee', 'cafe', '37 Customhouse Quay, Wellington', -41.2860, 174.7780),
  ('10000000-0000-0000-0000-000000000027', 'Memphis Belle', 'cafe', '13 Courtenay Place, Te Aro', -41.2930, 174.7790),
  ('10000000-0000-0000-0000-000000000028', 'Fidels', 'cafe', '234 Cuba Street, Te Aro', -41.2960, 174.7735),
  -- Restaurants
  ('10000000-0000-0000-0000-000000000006', 'Hiakai', 'restaurant', '90 Tory Street, Te Aro', -41.2942, 174.7785),
  ('10000000-0000-0000-0000-000000000007', 'Egmont Street Deli', 'restaurant', '12 Egmont Street, Te Aro', -41.2905, 174.7752),
  ('10000000-0000-0000-0000-000000000008', 'Aunty Mena''s', 'restaurant', '167 Cuba Street, Te Aro', -41.2947, 174.7740),
  ('10000000-0000-0000-0000-000000000029', 'Logan Brown', 'restaurant', '192 Cuba Street, Te Aro', -41.2955, 174.7738),
  ('10000000-0000-0000-0000-000000000030', 'Ortega Fish Shack', 'restaurant', '16 Majoribanks Street, Mt Victoria', -41.2945, 174.7830),
  ('10000000-0000-0000-0000-000000000031', 'Capitol', 'restaurant', '10 Kent Terrace, Mt Victoria', -41.2938, 174.7828),
  ('10000000-0000-0000-0000-000000000032', 'Dragonfly', 'restaurant', '9 Courtenay Place, Te Aro', -41.2928, 174.7792),
  ('10000000-0000-0000-0000-000000000033', 'Mr Go''s', 'restaurant', '2 Taranaki Street, Te Aro', -41.2908, 174.7762),
  ('10000000-0000-0000-0000-000000000034', 'KK Malaysian', 'restaurant', '11 Frederick Street, Te Aro', -41.2925, 174.7725),
  -- Bars
  ('10000000-0000-0000-0000-000000000009', 'Hashigo Zake', 'bar', '25 Taranaki Street, Te Aro', -41.2912, 174.7758),
  ('10000000-0000-0000-0000-000000000010', 'Golding''s Free Dive', 'bar', '14 Leeds Street, Te Aro', -41.2920, 174.7748),
  ('10000000-0000-0000-0000-000000000011', 'The Library', 'bar', '53 Courtenay Place, Te Aro', -41.2935, 174.7795),
  ('10000000-0000-0000-0000-000000000012', 'Rogue & Vagabond', 'bar', '18 Garrett Street, Te Aro', -41.2932, 174.7788),
  ('10000000-0000-0000-0000-000000000035', 'Hawthorn Lounge', 'bar', '82 Tory Street, Te Aro', -41.2940, 174.7782),
  ('10000000-0000-0000-0000-000000000036', 'Fork & Brewer', 'bar', '14 Bond Street, Wellington', -41.2870, 174.7755),
  ('10000000-0000-0000-0000-000000000037', 'Little Beer Quarter', 'bar', '6 Edward Street, Te Aro', -41.2918, 174.7762),
  ('10000000-0000-0000-0000-000000000038', 'Laundry', 'bar', '240 Cuba Street, Te Aro', -41.2962, 174.7734),
  ('10000000-0000-0000-0000-000000000039', 'Garage Project Taproom', 'bar', '68 Aro Street, Aro Valley', -41.2945, 174.7700),
  -- Attractions
  ('10000000-0000-0000-0000-000000000013', 'Te Papa Museum', 'attraction', '55 Cable Street, Wellington', -41.2907, 174.7822),
  ('10000000-0000-0000-0000-000000000014', 'Wellington Cable Car', 'attraction', '280 Lambton Quay, Wellington', -41.2843, 174.7706),
  ('10000000-0000-0000-0000-000000000015', 'Zealandia', 'attraction', '53 Waiapu Road, Karori', -41.2900, 174.7530),
  ('10000000-0000-0000-0000-000000000040', 'Wellington Museum', 'attraction', '3 Jervois Quay, Wellington', -41.2855, 174.7810),
  ('10000000-0000-0000-0000-000000000041', 'Space Place', 'attraction', 'Botanic Garden, Kelburn', -41.2805, 174.7685),
  ('10000000-0000-0000-0000-000000000042', 'City Gallery Wellington', 'attraction', '101 Wakefield Street, Te Aro', -41.2888, 174.7778),
  -- Parks
  ('10000000-0000-0000-0000-000000000016', 'Wellington Botanic Garden', 'park', '101 Glenmore Street, Kelburn', -41.2810, 174.7690),
  ('10000000-0000-0000-0000-000000000017', 'Mt Victoria Lookout', 'park', 'Lookout Road, Mt Victoria', -41.2960, 174.7900),
  ('10000000-0000-0000-0000-000000000018', 'Oriental Bay', 'park', 'Oriental Parade, Wellington', -41.2880, 174.7880),
  ('10000000-0000-0000-0000-000000000043', 'Waitangi Park', 'park', 'Cable Street, Te Aro', -41.2915, 174.7838),
  ('10000000-0000-0000-0000-000000000044', 'Frank Kitts Park', 'park', 'Jervois Quay, Wellington', -41.2848, 174.7790),
  ('10000000-0000-0000-0000-000000000045', 'Town Belt', 'park', 'Ellice Street, Mt Victoria', -41.2985, 174.7870),
  -- Venues
  ('10000000-0000-0000-0000-000000000019', 'San Fran', 'venue', '171 Cuba Street, Te Aro', -41.2949, 174.7739),
  ('10000000-0000-0000-0000-000000000020', 'Meow', 'venue', '9 Edward Street, Te Aro', -41.2920, 174.7760),
  ('10000000-0000-0000-0000-000000000021', 'Valhalla', 'venue', '134 Vivian Street, Te Aro', -41.2955, 174.7752),
  ('10000000-0000-0000-0000-000000000022', 'BATS Theatre', 'venue', '1 Kent Terrace, Mt Victoria', -41.2940, 174.7830),
  ('10000000-0000-0000-0000-000000000046', 'Circa Theatre', 'venue', '1 Taranaki Street, Te Aro', -41.2900, 174.7810),
  ('10000000-0000-0000-0000-000000000047', 'The Opera House', 'venue', '111-113 Manners Street, Te Aro', -41.2918, 174.7738),
  ('10000000-0000-0000-0000-000000000048', 'TSB Arena', 'venue', '4 Queens Wharf, Wellington', -41.2838, 174.7800),
  ('10000000-0000-0000-0000-000000000049', 'Wharewaka', 'venue', '2 Taranaki Street Wharf, Te Aro', -41.2895, 174.7815),
  ('10000000-0000-0000-0000-000000000050', 'Caroline', 'venue', '15 Tory Street, Te Aro', -41.2918, 174.7778),
  ('10000000-0000-0000-0000-000000000051', 'Everybody Eats', 'restaurant', '60 Dixon Street, Te Aro', -41.2913, 174.7740);

-- ============================================================
-- POSTS (65 posts for seed data — many places with multiple visitors)
-- Dates are relative to CURRENT_DATE so data always looks fresh.
-- Posts span from 11 days ago to today.
-- ============================================================
INSERT INTO posts (id, user_id, place_id, type, content, media_url, likes, created_at) VALUES
  -- Flight Coffee (3 posters: u2, u5, u1)
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'photo',
   'Flight Coffee never misses. Their single origin pour-over is consistently the best in town.',
   'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600', 12, (CURRENT_DATE - 3) + TIME '09:00:00'),
  ('20000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'photo',
   'Finally tried Flight Coffee. The hype is real — best espresso I''ve had in weeks.',
   'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600', 8, (CURRENT_DATE - 2) + TIME '08:30:00'),
  ('20000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'text',
   'Morning ritual at Flight. The baristas here genuinely care about the craft.',
   null, 5, (CURRENT_DATE - 1) + TIME '07:45:00'),

  -- Hashigo Zake (3 posters: u7, u9, u4)
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000009', 'photo',
   'Hashigo Zake has the best craft beer selection in Wellington. 24 taps of pure happiness.',
   'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600', 8, (CURRENT_DATE - 3) + TIME '18:00:00'),
  ('20000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000009', 'photo',
   'Late night at Hashigo. They had a rare Belgian sour on tap. Heaven.',
   'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600', 6, (CURRENT_DATE - 2) + TIME '22:00:00'),
  ('20000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000009', 'text',
   'Pre-gig beers at Hashigo. The staff always have great recommendations.',
   null, 4, (CURRENT_DATE - 1) + TIME '17:30:00'),

  -- Te Papa (4 posters: u3, u6, u8, u1)
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000013', 'photo',
   'The new exhibition at Te Papa is absolutely stunning. Free entry and world-class art.',
   'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=600', 15, (CURRENT_DATE - 4) + TIME '14:00:00'),
  ('20000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000013', 'photo',
   'Rainy day at Te Papa. The earthquake exhibit never gets old.',
   'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600', 11, (CURRENT_DATE - 3) + TIME '11:00:00'),
  ('20000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000013', 'text',
   'Took the kids to Te Papa today. They loved the colossal squid. Free and world-class — Wellington is lucky.',
   null, 9, (CURRENT_DATE - 2) + TIME '15:00:00'),
  ('20000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000013', 'photo',
   'Te Papa at sunset from the waterfront. What a building.',
   'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=600', 13, (CURRENT_DATE - 1) + TIME '18:30:00'),

  -- Mt Victoria Lookout (5 posters: u6, u3, u1, u8, u10)
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000017', 'photo',
   'Sunrise from Mt Vic this morning. Wellington at its best. Worth the early alarm!',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', 22, (CURRENT_DATE - 5) + TIME '06:30:00'),
  ('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000017', 'photo',
   'Golden hour from Mt Vic never gets old. This city is beautiful.',
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600', 20, (CURRENT_DATE - 4) + TIME '19:00:00'),
  ('20000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000017', 'photo',
   'Night view from Mt Vic. City lights reflecting on the harbour.',
   'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600', 18, (CURRENT_DATE - 3) + TIME '21:00:00'),
  ('20000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000017', 'text',
   'Ran up Mt Vic at lunch. 15 minutes from the office to this view. Wellington is unbeatable.',
   null, 10, (CURRENT_DATE - 2) + TIME '12:30:00'),
  ('20000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000017', 'photo',
   'Took visiting friends to Mt Vic. Their minds were blown.',
   'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600', 7, (CURRENT_DATE - 1) + TIME '16:00:00'),

  -- Customs (2 posters: u5, u2)
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'photo',
   'Customs doing what Customs does best. This flat white is perfection.',
   'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600', 9, (CURRENT_DATE - 3) + TIME '08:00:00'),
  ('20000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'photo',
   'Customs by Coffee Supreme. The name says it all. Supreme.',
   'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600', 7, (CURRENT_DATE - 1) + TIME '09:00:00'),

  -- San Fran (4 posters: u4, u9, u10, u3)
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000019', 'photo',
   'San Fran last night was absolutely electric. What a lineup!',
   'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600', 18, (CURRENT_DATE - 2) + TIME '00:00:00'),
  ('20000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000019', 'photo',
   'San Fran always delivers. Best sound system on Cuba Street.',
   'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600', 14, (CURRENT_DATE - 4) + TIME '23:00:00'),
  ('20000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000019', 'text',
   'Comedy night at San Fran was hilarious. This venue does everything well.',
   null, 9, (CURRENT_DATE - 3) + TIME '22:30:00'),
  ('20000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000019', 'photo',
   'Shot some bands at San Fran tonight. The lighting is always perfect for photography.',
   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600', 11, (CURRENT_DATE - 1) + TIME '23:30:00'),

  -- Loretta (3 posters: u2, u5, u8)
  ('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'photo',
   'Loretta brunch is always a vibe. The lamb shoulder is insane.',
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', 14, (CURRENT_DATE - 3) + TIME '11:00:00'),
  ('20000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'photo',
   'Loretta cold brew on a hot day. Perfect.',
   'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600', 6, (CURRENT_DATE - 1) + TIME '14:00:00'),
  ('20000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 'text',
   'Loretta for brunch with the crew. Always busy but always worth the wait.',
   null, 8, (CURRENT_DATE - 2) + TIME '10:30:00'),

  -- Botanic Garden (3 posters: u6, u3, u8)
  ('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000016', 'photo',
   'The roses in the Botanic Garden are incredible this time of year.',
   'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=600', 11, (CURRENT_DATE - 6) + TIME '15:00:00'),
  ('20000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000016', 'photo',
   'Shooting the fern house in the Botanic Garden. So lush.',
   'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600', 9, (CURRENT_DATE - 4) + TIME '10:00:00'),
  ('20000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000016', 'text',
   'Sunday stroll through the Botanic Garden. The kids loved the playground.',
   null, 5, (CURRENT_DATE - 5) + TIME '11:00:00'),

  -- Valhalla (2 posters: u9, u4)
  ('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000021', 'photo',
   'Valhalla doom night. Walls were shaking. Ears still ringing.',
   'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600', 7, (CURRENT_DATE - 3) + TIME '23:00:00'),
  ('20000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000021', 'photo',
   'Valhalla is the heart and soul of Wellington heavy music. Long may it reign.',
   'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600', 10, (CURRENT_DATE - 2) + TIME '23:30:00'),

  -- Golding''s Free Dive (3 posters: u8, u7, u2)
  ('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000010', 'photo',
   'Golding''s Free Dive is such a hidden gem. Pizza and craft beer in a laneway.',
   'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600', 10, (CURRENT_DATE - 4) + TIME '19:00:00'),
  ('20000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000010', 'photo',
   'Leeds Street laneway is such a vibe. Golding''s pizza + Fortune Favours beer = perfect combo.',
   'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600', 8, (CURRENT_DATE - 3) + TIME '19:30:00'),
  ('20000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000010', 'text',
   'Golding''s on a Friday. Laneway buzzing, pizzas flying. This is why Wellington rules.',
   null, 6, CURRENT_DATE + TIME '18:00:00'),

  -- Prefab (2 posters: u5, u2)
  ('20000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'photo',
   'Prefab on a sunny morning. This courtyard is perfection.',
   'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600', 6, (CURRENT_DATE - 5) + TIME '10:00:00'),
  ('20000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'photo',
   'Prefab cabinet food is always on point. Grabbed a scone and a latte.',
   'https://images.unsplash.com/photo-1509365390695-33aee754301f?w=600', 5, (CURRENT_DATE - 2) + TIME '09:00:00'),

  -- Meow (3 posters: u4, u9, u3)
  ('20000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000020', 'photo',
   'Meow is the GOAT venue. Intimate but the sound is always dialled in.',
   'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600', 13, (CURRENT_DATE - 3) + TIME '22:00:00'),
  ('20000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000020', 'photo',
   'Meow on a Tuesday. Still packed. Wellington music scene is alive.',
   'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600', 7, (CURRENT_DATE - 2) + TIME '21:00:00'),
  ('20000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000020', 'photo',
   'Shot some incredible live shots at Meow tonight. The intimacy of this venue is perfect for photography.',
   'https://images.unsplash.com/photo-1508854710579-5cecc3a9ff17?w=600', 11, (CURRENT_DATE - 1) + TIME '22:00:00'),

  -- Hiakai (2 posters: u2, u1)
  ('20000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 'photo',
   'Hiakai is doing incredible things with indigenous NZ ingredients. A must-try.',
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600', 16, (CURRENT_DATE - 6) + TIME '20:00:00'),
  ('20000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'text',
   'Hiakai blew my mind. The kawakawa dessert is unlike anything else. Book ahead.',
   null, 12, (CURRENT_DATE - 1) + TIME '21:00:00'),

  -- The Library (2 posters: u9, u7)
  ('20000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000011', 'photo',
   'The Library cocktails are next level. Try the Old Fashioned.',
   'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600', 9, (CURRENT_DATE - 5) + TIME '21:00:00'),
  ('20000000-0000-0000-0000-000000000046', '00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000011', 'photo',
   'The Library is hidden behind a bookshelf door. Best speakeasy vibes in Wellington.',
   'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600', 11, (CURRENT_DATE - 2) + TIME '20:30:00'),

  -- Oriental Bay (4 posters: u6, u3, u1, u5)
  ('20000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000018', 'photo',
   'Evening swim at Oriental Bay. Summer in Wellington is perfection.',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', 17, (CURRENT_DATE - 7) + TIME '18:00:00'),
  ('20000000-0000-0000-0000-000000000047', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000018', 'photo',
   'Oriental Bay golden hour. The colour of the water today was unreal.',
   'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=600', 14, (CURRENT_DATE - 3) + TIME '18:30:00'),
  ('20000000-0000-0000-0000-000000000048', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000018', 'text',
   'Morning coffee on the Oriental Bay promenade. Best commute ever.',
   null, 6, (CURRENT_DATE - 2) + TIME '07:30:00'),
  ('20000000-0000-0000-0000-000000000049', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000018', 'photo',
   'Wellington on a calm day. Oriental Bay looks like the Mediterranean.',
   'https://images.unsplash.com/photo-1468413253725-0d5181091126?w=600', 9, (CURRENT_DATE - 1) + TIME '12:00:00'),

  -- BATS Theatre (1 poster: u10)
  ('20000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000022', 'photo',
   'BATS Theatre is such a treasure. Tiny but mighty.',
   'https://images.unsplash.com/photo-1503095396549-807759245b35?w=600', 8, (CURRENT_DATE - 11) + TIME '22:00:00'),

  -- Rogue & Vagabond (3 posters: u7, u4, u9)
  ('20000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000012', 'photo',
   'Rogue & Vagabond garden sessions are so good in summer.',
   'https://images.unsplash.com/photo-1575037614876-c38a4b44571d?w=600', 11, (CURRENT_DATE - 5) + TIME '16:00:00'),
  ('20000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000012', 'photo',
   'Rogue & Vagabond before a show. Great vibes, great people.',
   'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600', 7, (CURRENT_DATE - 3) + TIME '17:00:00'),
  ('20000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000012', 'text',
   'Rogue & Vagabond on a sunny arvo. Best beer garden in the city.',
   null, 5, (CURRENT_DATE - 1) + TIME '15:00:00'),

  -- Zealandia (2 posters: u3, u6)
  ('20000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000015', 'photo',
   'Zealandia at dawn. Heard a kiwi call for the first time!',
   'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=600', 19, (CURRENT_DATE - 8) + TIME '06:00:00'),
  ('20000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000015', 'photo',
   'Night tour at Zealandia. Saw tuatara and glow worms. Magical.',
   'https://images.unsplash.com/photo-1470058869958-2a77571e9182?w=600', 15, (CURRENT_DATE - 3) + TIME '20:00:00'),

  -- Aunty Mena''s (2 posters: u8, u2)
  ('20000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', 'text',
   'Aunty Mena''s is the best vegetarian food in Wellington. The hot sauce is seriously next level. Go hungry.',
   null, 7, (CURRENT_DATE - 7) + TIME '13:00:00'),
  ('20000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000008', 'photo',
   'Aunty Mena''s laksa on a cold day. Pure comfort.',
   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600', 9, (CURRENT_DATE - 2) + TIME '12:00:00'),

  -- Peoples Coffee (3 posters: u5, u1, u8)
  ('20000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000023', 'photo',
   'Peoples Coffee in Newtown. Fair trade and delicious. Love what they stand for.',
   'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600', 8, (CURRENT_DATE - 4) + TIME '09:00:00'),
  ('20000000-0000-0000-0000-000000000055', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000023', 'text',
   'Peoples Coffee is my go-to in Newtown. Ethical and excellent.',
   null, 4, (CURRENT_DATE - 2) + TIME '08:00:00'),
  ('20000000-0000-0000-0000-000000000056', '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000023', 'photo',
   'Saturday morning at Peoples. The courtyard is perfect for people watching.',
   'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600', 6, (CURRENT_DATE - 6) + TIME '10:00:00'),

  -- Lamason Brew Bar (2 posters: u5, u2)
  ('20000000-0000-0000-0000-000000000057', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000024', 'photo',
   'Lamason doing a gorgeous filter coffee today. The space is beautiful too.',
   'https://images.unsplash.com/photo-1497515114889-2e3e4a17d621?w=600', 10, (CURRENT_DATE - 3) + TIME '09:30:00'),
  ('20000000-0000-0000-0000-000000000058', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000024', 'photo',
   'Lamason Brew Bar is underrated. The interior alone is worth the visit.',
   'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=600', 7, (CURRENT_DATE - 1) + TIME '10:00:00'),

  -- Garage Project Taproom (4 posters: u7, u9, u4, u1)
  ('20000000-0000-0000-0000-000000000059', '00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000039', 'photo',
   'Garage Project Taproom is beer paradise. 18 taps of their freshest brews.',
   'https://images.unsplash.com/photo-1532634993-15f421e42ec0?w=600', 14, (CURRENT_DATE - 5) + TIME '17:00:00'),
  ('20000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000039', 'photo',
   'Friday night at Garage Project. The Aro Street spot is always buzzing.',
   'https://images.unsplash.com/photo-1575367439058-6096bb9cf5e1?w=600', 10, CURRENT_DATE + TIME '18:00:00'),
  ('20000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000039', 'text',
   'Pre-gig pints at Garage Project. Their hazy IPA is elite.',
   null, 6, (CURRENT_DATE - 3) + TIME '16:30:00'),
  ('20000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000039', 'photo',
   'Garage Project taproom never disappoints. Tried the new sour — incredible.',
   'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=600', 8, (CURRENT_DATE - 1) + TIME '17:00:00'),

  -- Waitangi Park (2 posters: u6, u1)
  ('20000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000043', 'photo',
   'Waitangi Park skatepark session. Wellington kids are so talented.',
   'https://images.unsplash.com/photo-1564429238961-bf8e86aee0f9?w=600', 7, (CURRENT_DATE - 4) + TIME '16:00:00'),
  ('20000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000043', 'text',
   'Lunch at Waitangi Park. The waterfront is so good in summer.',
   null, 3, (CURRENT_DATE - 2) + TIME '12:30:00'),

  -- Logan Brown (2 posters: u2, u1)
  ('20000000-0000-0000-0000-000000000065', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000029', 'photo',
   'Logan Brown for a special occasion. The paua ravioli is iconic for a reason.',
   'https://images.unsplash.com/photo-1550966871-3ed3cdb51f73?w=600', 13, (CURRENT_DATE - 6) + TIME '19:30:00'),
  ('20000000-0000-0000-0000-000000000066', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000029', 'text',
   'Logan Brown never disappoints. Fine dining that feels relaxed. So Wellington.',
   null, 8, (CURRENT_DATE - 1) + TIME '20:00:00'),

  -- Fidels (2 posters: u5, u4)
  ('20000000-0000-0000-0000-000000000067', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000028', 'photo',
   'Fidels is a Cuba Street institution. The vibe is unmatched.',
   'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600', 7, (CURRENT_DATE - 3) + TIME '10:00:00'),
  ('20000000-0000-0000-0000-000000000068', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000028', 'text',
   'Post-gig breakfast at Fidels. Some things never change.',
   null, 5, (CURRENT_DATE - 2) + TIME '11:00:00'),

  -- City Gallery (2 posters: u3, u10)
  ('20000000-0000-0000-0000-000000000069', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000042', 'photo',
   'City Gallery has a phenomenal new show on. Free entry. No excuses.',
   'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=600', 12, (CURRENT_DATE - 5) + TIME '14:00:00'),
  ('20000000-0000-0000-0000-000000000070', '00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000042', 'text',
   'City Gallery is so underrated. Brilliant contemporary art in a beautiful space.',
   null, 6, (CURRENT_DATE - 2) + TIME '15:00:00'),

  -- Hawthorn Lounge (2 posters: u9, u2)
  ('20000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000035', 'photo',
   'Hawthorn Lounge cocktails are art. The smoky old fashioned is insane.',
   'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600', 10, (CURRENT_DATE - 4) + TIME '21:00:00'),
  ('20000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000035', 'photo',
   'Date night at Hawthorn Lounge. Speakeasy perfection.',
   'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600', 8, (CURRENT_DATE - 1) + TIME '20:00:00'),

  -- Wellington Cable Car (3 posters: u3, u8, u6)
  ('20000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000014', 'photo',
   'The Cable Car is tourist-y but I love it every time. The view from the top is stunning.',
   'https://images.unsplash.com/photo-1567596275753-92607c3ce1ae?w=600', 13, (CURRENT_DATE - 7) + TIME '14:00:00'),
  ('20000000-0000-0000-0000-000000000074', '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000014', 'photo',
   'Kids absolutely loved the Cable Car. Their little faces at the top!',
   'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600', 9, (CURRENT_DATE - 4) + TIME '11:00:00'),
  ('20000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000014', 'text',
   'Walked up the Cable Car track instead of riding. Great little workout with an amazing reward at the top.',
   null, 6, (CURRENT_DATE - 2) + TIME '09:00:00');

-- ============================================================
-- POST MEDIA (multi-media posts — up to 5 photos/videos per post)
-- These posts have multiple images; the first item matches the post's media_url.
-- Requires the post_media migration to have been applied first.
-- ============================================================
INSERT INTO post_media (id, post_id, media_url, media_type, sort_order) VALUES
  -- Mt Vic sunrise by Tane (post 04) — 3 photos: sunrise, trail, panorama
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', 'photo', 0),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004',
   'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600', 'photo', 1),
  ('50000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004',
   'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600', 'photo', 2),

  -- Te Papa exhibition by Jordan (post 03) — 4 photos: exhibition, interior, art, building
  ('50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003',
   'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=600', 'photo', 0),
  ('50000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003',
   'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600', 'photo', 1),
  ('50000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003',
   'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600', 'photo', 2),
  ('50000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000003',
   'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=600', 'photo', 3),

  -- San Fran gig by Mel (post 06) — 3 photos: crowd, stage, band
  ('50000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000006',
   'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600', 'photo', 0),
  ('50000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000006',
   'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600', 'photo', 1),
  ('50000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000006',
   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600', 'photo', 2),

  -- Loretta brunch by Sarah (post 07) — 3 photos: food, coffee, interior
  ('50000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000007',
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', 'photo', 0),
  ('50000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000007',
   'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600', 'photo', 1),
  ('50000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000007',
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600', 'photo', 2),

  -- Zealandia dawn by Jordan (post 19) — 3 photos: forest, bird, glow worms
  ('50000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000019',
   'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=600', 'photo', 0),
  ('50000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000019',
   'https://images.unsplash.com/photo-1470058869958-2a77571e9182?w=600', 'photo', 1),
  ('50000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000019',
   'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600', 'photo', 2),

  -- Botanic Garden by Tane (post 08) — 5 photos: roses, fern house, trees, path, fountain
  ('50000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000008',
   'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=600', 'photo', 0),
  ('50000000-0000-0000-0000-000000000018', '20000000-0000-0000-0000-000000000008',
   'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600', 'photo', 1),
  ('50000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000008',
   'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600', 'photo', 2),
  ('50000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000008',
   'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600', 'photo', 3),
  ('50000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000008',
   'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600', 'photo', 4);

-- ============================================================
-- COMMENTS (selected subset)
-- Dates are relative to CURRENT_DATE, placed shortly after their parent post.
-- ============================================================
INSERT INTO comments (id, post_id, user_id, text, created_at) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Their Ethiopian single origin is unreal right now', (CURRENT_DATE - 3) + TIME '10:00:00'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Best pour-over in town for sure', (CURRENT_DATE - 3) + TIME '11:00:00'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Such a powerful exhibition. Everyone should see it.', (CURRENT_DATE - 4) + TIME '16:00:00'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Free entry is amazing for something this good', (CURRENT_DATE - 4) + TIME '17:00:00'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Went last week, was blown away', (CURRENT_DATE - 4) + TIME '18:00:00'),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Sunset from the top is unreal!', (CURRENT_DATE - 5) + TIME '18:00:00'),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'One of my favourite Wellington walks', (CURRENT_DATE - 5) + TIME '19:30:00'),
  ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000009', 'Wellington music scene is the best in NZ, no contest', (CURRENT_DATE - 2) + TIME '08:00:00'),
  ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Loretta lamb shoulder is top 3 dishes in Wellington for me', (CURRENT_DATE - 3) + TIME '21:00:00'),
  ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004', 'Wish I was there! Doom metal at Valhalla is always heavy.', (CURRENT_DATE - 3) + TIME '23:30:00'),
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004', 'Best date spot in Welly for sure', (CURRENT_DATE - 4) + TIME '20:00:00'),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000007', 'This photo is stunning. What camera are you using?', (CURRENT_DATE - 4) + TIME '20:00:00'),
  ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Golden hour from Mt Vic never gets old', (CURRENT_DATE - 4) + TIME '20:30:00'),
  ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Need to try this. Been on my list forever.', (CURRENT_DATE - 6) + TIME '21:00:00'),
  ('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000003', 'The garden sessions are so good in summer!', (CURRENT_DATE - 5) + TIME '17:00:00');

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
-- EVENTS (10 upcoming events — dates relative to CURRENT_DATE)
-- ============================================================
INSERT INTO events (id, title, description, place_id, date, start_time, end_time, image_url, category, ticket_url) VALUES
  ('40000000-0000-0000-0000-000000000001', 'Friday Night Jazz', 'Live jazz trio performing standards and originals. Perfect way to kick off the weekend.',
   '10000000-0000-0000-0000-000000000019', CURRENT_DATE + INTERVAL '3 days', '20:00', '23:00',
   'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600', 'music',
   'https://www.eventfinda.co.nz/friday-night-jazz-wellington'),
  ('40000000-0000-0000-0000-000000000002', 'Wellington Comedy Night', 'Five of Wellington''s best comedians battle it out. Hosted by Kate Nguyen.',
   '10000000-0000-0000-0000-000000000019', CURRENT_DATE + INTERVAL '5 days', '19:30', '22:00',
   'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=600', 'comedy',
   'https://www.eventfinda.co.nz/wellington-comedy-night'),
  ('40000000-0000-0000-0000-000000000003', 'Harbourside Market', 'Fresh produce, artisan goods, street food. Every Sunday morning.',
   '10000000-0000-0000-0000-000000000018', CURRENT_DATE + INTERVAL '7 days', '07:30', '14:00',
   'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600', 'market', null),
  ('40000000-0000-0000-0000-000000000004', 'Garage Project Tap Takeover', 'Garage Project takes over all 24 taps at Hashigo Zake. Special releases and one-offs.',
   '10000000-0000-0000-0000-000000000009', CURRENT_DATE + INTERVAL '10 days', '17:00', '23:00',
   'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600', 'food', null),
  ('40000000-0000-0000-0000-000000000005', 'Mt Vic Moonlight Walk', 'Guided night walk up Mt Victoria. Bring a torch and warm layers.',
   '10000000-0000-0000-0000-000000000017', CURRENT_DATE + INTERVAL '12 days', '20:00', '22:00',
   'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=600', 'community', null),
  ('40000000-0000-0000-0000-000000000006', 'Punk Showcase', 'Four local punk bands. $10 door. All ages.',
   '10000000-0000-0000-0000-000000000021', CURRENT_DATE + INTERVAL '4 days', '19:00', '23:30',
   'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600', 'music',
   'https://www.eventfinda.co.nz/punk-showcase-valhalla'),
  ('40000000-0000-0000-0000-000000000007', 'New Zealand Art Exhibition', 'Contemporary NZ artists explore identity and place. Free entry.',
   '10000000-0000-0000-0000-000000000013', CURRENT_DATE + INTERVAL '14 days', '10:00', '17:00',
   'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=600', 'art', null),
  ('40000000-0000-0000-0000-000000000008', 'Electronic Night at Meow', 'DJs spinning house, techno, and drum & bass until late.',
   '10000000-0000-0000-0000-000000000020', CURRENT_DATE + INTERVAL '6 days', '22:00', null,
   'https://images.unsplash.com/photo-1571266028243-d220d067bacc?w=600', 'music',
   'https://www.eventfinda.co.nz/electronic-night-meow'),
  ('40000000-0000-0000-0000-000000000009', 'BATS Theatre: One-Act Festival', 'Short plays from emerging Wellington playwrights. Three nights only.',
   '10000000-0000-0000-0000-000000000022', CURRENT_DATE + INTERVAL '8 days', '19:00', '21:30',
   'https://images.unsplash.com/photo-1503095396549-807759245b35?w=600', 'art',
   'https://bfringe.co.nz/one-act-festival'),
  ('40000000-0000-0000-0000-000000000010', 'Botanic Garden Guided Tour', 'Expert-led tour of the heritage rose garden and native bush.',
   '10000000-0000-0000-0000-000000000016', CURRENT_DATE + INTERVAL '9 days', '10:00', '12:00',
   'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=600', 'community', null),
  ('40000000-0000-0000-0000-000000000011', 'Everybody Eats Wellington', 'Pay-what-you-can community dinner. Rescued food transformed into quality 3-course meals, reducing food waste and social isolation.',
   '10000000-0000-0000-0000-000000000051', CURRENT_DATE + INTERVAL '2 days', '18:00', '21:00',
   'https://volunteers.everybodyeats.nz/_next/image?url=%2Fhero.jpg&w=2048&q=75&dpl=dpl_GSgpFADndVcyRRuCjggKurYj9KZX', 'community', null);

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
  ('40000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000008'),
  -- Everybody Eats Wellington
  ('40000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000008'),
  ('40000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000006');
