-- Wellington App — Curated Content Seed
-- Run AFTER seed.sql (or on its own — uses ON CONFLICT to be idempotent)
--
-- Creates:
--   1. @welly official curator account with editorial posts & guides
--   2. Posts for places with zero coverage
--   3. 8 curated guides from @welly
--   4. Cross-follow network so all users follow @welly
--   5. Additional likes, comments, and engagement
--
-- NOTE: You must create the @welly auth user first. Use create-seed-users.mjs.

-- ============================================================
-- @WELLY PROFILE (official curator account)
-- ============================================================
INSERT INTO profiles (id, username, display_name, avatar_url, bio, onboarding_completed) VALUES
  ('00000000-0000-0000-0000-000000000011', 'welly', 'Welly', 'https://images.unsplash.com/photo-1601134467661-3d775b999c8b?w=200', 'Your guide to Wellington. Curated by locals, for locals.', true)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  onboarding_completed = EXCLUDED.onboarding_completed;

-- ============================================================
-- WELLY POSTS — editorial posts covering places with low/no coverage
-- UUID range: 20000000-0000-0000-0000-000000000100+
-- ============================================================
INSERT INTO posts (id, user_id, place_id, type, content, media_url, likes, created_at) VALUES
  -- ── Places with ZERO coverage ──

  -- Hillside Kitchen & Cellar
  ('20000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004', 'photo',
   'Hillside Kitchen is Thorndon''s best-kept secret. Seasonal menu, gorgeous courtyard, and the kind of food that makes you rethink everything. Book ahead. #hiddengem #thorndon',
   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600', 24, (CURRENT_DATE - 8) + TIME '12:00:00'),

  -- Egmont Street Deli
  ('20000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000007', 'photo',
   'Egmont Street Deli. Tiny, packed, and absolutely worth the queue. The sandwiches here are legendary. #brunch #tearo',
   'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600', 19, (CURRENT_DATE - 7) + TIME '11:30:00'),

  -- Ortega Fish Shack
  ('20000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000030', 'photo',
   'Ortega Fish Shack is where Wellington does seafood right. The ceviche alone is worth the trip. One of the city''s great restaurants. #finedining #seafood',
   'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600', 21, (CURRENT_DATE - 6) + TIME '19:30:00'),

  -- Capitol
  ('20000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000031', 'photo',
   'Capitol on Kent Terrace. NZ-inspired tasting menu that genuinely surprised us. The wine pairings are impeccable. #finedining #nzfood',
   'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', 18, (CURRENT_DATE - 10) + TIME '20:00:00'),

  -- Dragonfly
  ('20000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000032', 'photo',
   'Dragonfly on Courtenay Place. Cocktails and small plates that punch way above their weight. Perfect pre-show stop. #cocktails #courtenaypla',
   'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600', 14, (CURRENT_DATE - 5) + TIME '18:00:00'),

  -- Mr Go's
  ('20000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000033', 'photo',
   'Mr Go''s does the best dumplings in Wellington. No debate. Generous portions, BYO, and always buzzing. #dumplings #byo',
   'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600', 22, (CURRENT_DATE - 4) + TIME '19:00:00'),

  -- KK Malaysian
  ('20000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000034', 'photo',
   'KK Malaysian on Frederick Street. Proper Malaysian food that locals have quietly loved for years. The laksa is the real deal. #malaysian #hiddengem',
   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600', 16, (CURRENT_DATE - 9) + TIME '12:30:00'),

  -- Fork & Brewer
  ('20000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000036', 'photo',
   'Fork & Brewer — craft brewery and restaurant with seriously good wood-fired pizza. Great spot to watch the game too. #craftbeer #pizza',
   'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600', 12, (CURRENT_DATE - 3) + TIME '18:30:00'),

  -- Little Beer Quarter
  ('20000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000037', 'photo',
   'Little Beer Quarter. Solid tap list, decent food, and a chill vibe. The kind of bar Wellington does better than anywhere. #craftbeer #tearo',
   'https://images.unsplash.com/photo-1575367439058-6096bb9cf5e1?w=600', 10, (CURRENT_DATE - 2) + TIME '17:00:00'),

  -- Laundry
  ('20000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000038', 'photo',
   'Laundry on Cuba Street. Part bar, part venue, all good times. The courtyard out back is one of Wellington''s best-kept secrets. #cubastreet #livemusic',
   'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600', 15, (CURRENT_DATE - 7) + TIME '21:00:00'),

  -- Wellington Museum
  ('20000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000040', 'photo',
   'Wellington Museum on the waterfront. Free entry and beautifully designed exhibitions about the city''s history. Don''t miss the earthquake simulator. #freeentry #waterfront',
   'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=600', 17, (CURRENT_DATE - 11) + TIME '14:00:00'),

  -- Space Place
  ('20000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000041', 'photo',
   'Space Place at the top of the Botanic Garden. The planetarium show is surprisingly good. Perfect rainy day activity. #space #botanicgarden',
   'https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=600', 13, (CURRENT_DATE - 6) + TIME '15:00:00'),

  -- Frank Kitts Park
  ('20000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000044', 'photo',
   'Frank Kitts Park at golden hour. The playground, the views, the food trucks on weekends. Central Wellington at its best. #waterfront #goldenhour',
   'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=600', 15, (CURRENT_DATE - 4) + TIME '18:30:00'),

  -- Town Belt
  ('20000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000045', 'photo',
   'The Town Belt is Wellington''s green lung. Hundreds of hectares of bush wrapping around the city. Trails everywhere, most of them empty. Go explore. #nature #trails',
   'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600', 11, (CURRENT_DATE - 3) + TIME '09:00:00'),

  -- Circa Theatre
  ('20000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000046', 'photo',
   'Circa Theatre right on the waterfront. Professional theatre in an intimate setting. The bar has great harbour views too. #theatre #waterfront',
   'https://images.unsplash.com/photo-1503095396549-807759245b35?w=600', 14, (CURRENT_DATE - 8) + TIME '19:30:00'),

  -- The Opera House
  ('20000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000047', 'photo',
   'The Opera House on Manners Street. A beautiful heritage building hosting everything from ballet to comedy. Wellington''s grand old dame. #heritage #theatre',
   'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600', 16, (CURRENT_DATE - 12) + TIME '20:00:00'),

  -- Wharewaka
  ('20000000-0000-0000-0000-000000000116', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000049', 'photo',
   'Wharewaka on the waterfront. Cultural centre with stunning harbour views. Events here always feel special. #cultural #waterfront',
   'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=600', 10, (CURRENT_DATE - 5) + TIME '17:00:00'),

  -- Caroline
  ('20000000-0000-0000-0000-000000000117', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000050', 'photo',
   'Caroline on Tory Street. Great food, even better cocktails. The kind of neighbourhood bar every city needs. #cocktails #torystreet',
   'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600', 13, (CURRENT_DATE - 2) + TIME '19:00:00'),

  -- Everybody Eats
  ('20000000-0000-0000-0000-000000000118', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000051', 'photo',
   'Everybody Eats Wellington. Pay-what-you-can community dinners fighting food waste and loneliness. Three courses of rescued food transformed into something beautiful. This is Wellington at its best. #community #everybodyeats',
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', 28, (CURRENT_DATE - 1) + TIME '19:00:00'),

  -- Raglan Roast
  ('20000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000025', 'photo',
   'Raglan Roast on Dixon Street. Beans from Raglan, brewed with care. The long black here is exceptional. #coffee #tearo',
   'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600', 11, (CURRENT_DATE - 3) + TIME '08:30:00'),

  -- Mojo Coffee
  ('20000000-0000-0000-0000-000000000120', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000026', 'photo',
   'Mojo on the Quay. Wellington''s homegrown coffee chain and still one of the best. Quick, consistent, and always solid. #coffee #wellington',
   'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600', 9, (CURRENT_DATE - 6) + TIME '07:45:00'),

  -- Memphis Belle
  ('20000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000027', 'photo',
   'Memphis Belle on Courtenay Place. Open early, closes late, and the all-day breakfast is exactly what you need after a big night. #brunch #courtenaypla',
   'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600', 8, (CURRENT_DATE - 2) + TIME '10:00:00'),

  -- Northern Walkway Loop trail
  ('20000000-0000-0000-0000-000000000122', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000104', 'photo',
   'The Northern Walkway Loop. 5.5km through native bush from the Botanic Garden over Te Ahumairangi Hill. One of Wellington''s best loop walks — no retracing steps. #trails #nature #wellington',
   'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600', 17, (CURRENT_DATE - 5) + TIME '08:00:00'),

  -- ── Editorial/spotlight posts for key places ──

  -- Wellington overview post
  ('20000000-0000-0000-0000-000000000130', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000018', 'photo',
   'Wellington. Compact enough to walk everywhere, big enough to surprise you every day. The best little capital in the world. #wellington #orientalbay',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', 35, (CURRENT_DATE - 14) + TIME '18:00:00'),

  -- Cuba Street spotlight
  ('20000000-0000-0000-0000-000000000131', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000028', 'photo',
   'Cuba Street. The beating heart of Wellington. Buskers, bucket fountain, vintage shops, and more good food per square metre than anywhere else in NZ. #cubastreet #wellington',
   'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600', 30, (CURRENT_DATE - 13) + TIME '14:00:00'),

  -- Zealandia feature
  ('20000000-0000-0000-0000-000000000132', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000015', 'photo',
   'Zealandia is something truly special. A 500-year vision to restore native wildlife right in the middle of the city. You can hear kiwi call at night. Do the night tour. #zealandia #wildlife #conservation',
   'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=600', 26, (CURRENT_DATE - 9) + TIME '07:00:00'),

  -- Te Papa feature
  ('20000000-0000-0000-0000-000000000133', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000013', 'photo',
   'Te Papa. New Zealand''s national museum and it''s free. Six floors of incredible exhibitions, from Gallipoli to the colossal squid. A rainy day essential. #tepapa #freeentry #art',
   'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600', 23, (CURRENT_DATE - 11) + TIME '13:00:00'),

  -- Mt Vic feature
  ('20000000-0000-0000-0000-000000000134', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000017', 'photo',
   'Mt Victoria Lookout. 15 minutes from Courtenay Place to the best view in Wellington. Go for sunset — you won''t regret it. #mtvic #views #sunset',
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600', 32, (CURRENT_DATE - 10) + TIME '19:00:00')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ADDITIONAL POSTS FROM EXISTING USERS (filling coverage gaps)
-- ============================================================
INSERT INTO posts (id, user_id, place_id, type, content, media_url, likes, created_at) VALUES
  -- Sarah covers Ortega and Capitol
  ('20000000-0000-0000-0000-000000000140', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000030', 'photo',
   'Ortega Fish Shack for a birthday dinner. The whole fish was incredible. Wellington fine dining at its best. #finedining #seafood',
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600', 15, (CURRENT_DATE - 5) + TIME '20:30:00'),

  -- Alex covers Raglan Roast and Memphis Belle
  ('20000000-0000-0000-0000-000000000141', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000025', 'photo',
   'Raglan Roast is a sleeper hit. The beans are roasted in Raglan and they make a killer long black. #coffee',
   'https://images.unsplash.com/photo-1497515114889-2e3e4a17d621?w=600', 7, (CURRENT_DATE - 4) + TIME '08:00:00'),

  -- Mel covers Laundry
  ('20000000-0000-0000-0000-000000000142', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000038', 'photo',
   'Laundry on Cuba. Great bands, cheap drinks, and the courtyard is magic on a summer night. #livemusic #cubastreet',
   'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600', 11, (CURRENT_DATE - 3) + TIME '22:30:00'),

  -- Pete covers Fork & Brewer
  ('20000000-0000-0000-0000-000000000143', '00000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000036', 'photo',
   'Fork & Brewer late night. Their own brews and wood-fired pizza is a winning combo. #craftbeer #pizza',
   'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600', 8, (CURRENT_DATE - 2) + TIME '21:00:00'),

  -- Maya covers Everybody Eats
  ('20000000-0000-0000-0000-000000000144', '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000051', 'photo',
   'Everybody Eats is one of the most beautiful things happening in Wellington right now. Community, rescued food, no judgement. Go. #community #everybodyeats',
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', 16, (CURRENT_DATE - 1) + TIME '19:30:00'),

  -- Jordan covers City Gallery more
  ('20000000-0000-0000-0000-000000000145', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000042', 'photo',
   'City Gallery — the new installation is immersive and deeply moving. Free entry and world-class contemporary art. #art #freeentry',
   'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=600', 14, (CURRENT_DATE - 1) + TIME '15:00:00'),

  -- Tane covers Town Belt
  ('20000000-0000-0000-0000-000000000146', '00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000045', 'photo',
   'Morning trail run through the Town Belt. Bumped into a family of kereru. Only in Wellington. #nature #trailrunning',
   'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600', 9, (CURRENT_DATE - 2) + TIME '07:00:00'),

  -- Sam covers Little Beer Quarter
  ('20000000-0000-0000-0000-000000000147', '00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000037', 'photo',
   'Little Beer Quarter always has something interesting on tap. Great staff who actually know their beer. #craftbeer',
   'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600', 7, (CURRENT_DATE - 1) + TIME '18:00:00'),

  -- Kate covers Circa
  ('20000000-0000-0000-0000-000000000148', '00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000046', 'text',
   'Circa Theatre is producing some of the best theatre in the country right now. The waterfront location doesn''t hurt either.',
   null, 8, (CURRENT_DATE - 3) + TIME '21:00:00'),

  -- Maya covers Wellington Museum
  ('20000000-0000-0000-0000-000000000149', '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000040', 'photo',
   'Wellington Museum with the kids today. They loved the old Wellington diorama. Free and fantastic. #freeentry #kids',
   'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600', 10, (CURRENT_DATE - 4) + TIME '11:00:00')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- WELLY GUIDES — curated editorial guides
-- UUID range: 60000000-0000-0000-0000-000000000010+
-- ============================================================
INSERT INTO guides (id, user_id, title, description) VALUES
  ('60000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000011',
   'Essential Wellington: 15 Must-Visit Spots',
   'Brand new to Wellington? Start here. The places that define the city — from coffee to culture to late-night adventures.'),
  ('60000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011',
   'Cuba Street: The Complete Guide',
   'Wellington''s most vibrant street, block by block. Cafes, bars, venues, restaurants, and vintage shops.'),
  ('60000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000011',
   'Free Things to Do in Wellington',
   'Wellington is surprisingly affordable. Here are the best free experiences in the city.'),
  ('60000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000011',
   'Wellington for Foodies',
   'From fine dining to street food, Wellington punches well above its weight. Here''s where to eat.'),
  ('60000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000011',
   'Late Night Wellington',
   'Where to go when the sun goes down. The best bars, venues, and late-night eats.'),
  ('60000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000011',
   'Wellington Walks & Viewpoints',
   'From quick city lookouts to half-day bush walks. The best ways to see Wellington on foot.'),
  ('60000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000011',
   'Waterfront Wellington',
   'Everything along the harbour — from Frank Kitts Park to Oriental Bay. The best waterfront city in NZ.'),
  ('60000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000011',
   'Rainy Day Wellington',
   'Let''s be honest — it rains a lot. Here''s how to have a great day when the weather isn''t cooperating.')
ON CONFLICT (id) DO NOTHING;

-- ── Guide Places ──
INSERT INTO guide_places (guide_id, place_id, sort_order, note) VALUES
  -- Essential Wellington: 15 Must-Visit Spots
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 0, 'The best flat white in Wellington — start your morning here'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000013', 1, 'Six floors of free exhibitions. The national museum is world-class'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000017', 2, '15-minute walk from the city for the best panoramic view'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000019', 3, 'Live music every week on Cuba Street. Wellington''s favourite venue'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000015', 4, 'Native wildlife sanctuary — hear kiwi call at night'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', 5, 'Hidden laneway bar with craft beer and incredible pizza'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000018', 6, 'The closest thing Wellington has to a beach — gorgeous at sunset'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000006', 7, 'Indigenous NZ fine dining. Unlike anything you''ve had before'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000014', 8, 'Ride the iconic cable car up to the Botanic Garden'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', 9, 'Brunch institution on Cuba Street'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000039', 10, 'Wellington''s most famous craft brewery taproom'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000011', 11, 'Speakeasy hidden behind a bookshelf. Incredible cocktails'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000042', 12, 'Free contemporary art gallery in Civic Square'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000016', 13, 'Beautiful gardens and the best views over the city'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000051', 14, 'Pay-what-you-can community dinner. Wellington at its best'),

  -- Cuba Street: The Complete Guide
  ('60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000003', 0, 'Start with brunch at Loretta — the ricotta hotcakes are legendary'),
  ('60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000028', 1, 'Classic Cuba Street cafe. Great people watching'),
  ('60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000008', 2, 'Best vegetarian food in Wellington. The hot sauce is insane'),
  ('60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000019', 3, 'Live music venue that''s the soul of Cuba Street'),
  ('60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000038', 4, 'Bar, venue, and courtyard. Something always happening'),
  ('60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000021', 5, 'Heavy music venue. Wellington''s underground heartbeat'),
  ('60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000029', 6, 'Fine dining in a heritage bank building. The paua ravioli is iconic'),

  -- Free Things to Do in Wellington
  ('60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000013', 0, 'Te Papa is world-class and completely free'),
  ('60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000042', 1, 'Free contemporary art that rivals any gallery in NZ'),
  ('60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000040', 2, 'Beautiful free museum on the waterfront'),
  ('60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000016', 3, 'Stunning gardens with free entry year-round'),
  ('60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000017', 4, 'The best free viewpoint in the city'),
  ('60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000018', 5, 'Swim, walk, or just sit and watch the world go by'),
  ('60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000045', 6, 'Hundreds of hectares of bush trails wrapping around the city'),
  ('60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000044', 7, 'Playground, views, and weekend food trucks'),
  ('60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000051', 8, 'Pay-what-you-can community dinner. Technically free if you need it to be'),

  -- Wellington for Foodies
  ('60000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000006', 0, 'Indigenous NZ ingredients reimagined. A once-in-a-lifetime meal'),
  ('60000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000029', 1, 'Wellington''s most iconic fine dining restaurant'),
  ('60000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000030', 2, 'The best seafood in the city. The ceviche is perfection'),
  ('60000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000031', 3, 'NZ-inspired tasting menu that will surprise you'),
  ('60000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003', 4, 'The brunch that launched a thousand Instagram posts'),
  ('60000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000007', 5, 'Tiny deli, massive flavour. Queue early'),
  ('60000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000033', 6, 'Best dumplings in Wellington. BYO and generous portions'),
  ('60000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000034', 7, 'Authentic Malaysian that locals have loved for years'),
  ('60000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000008', 8, 'Best vegetarian in Wellington. Go hungry'),
  ('60000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000004', 9, 'Thorndon''s seasonal gem with a gorgeous courtyard'),

  -- Late Night Wellington
  ('60000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000035', 0, 'Start with cocktails at Hawthorn Lounge'),
  ('60000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000011', 1, 'Find the hidden door and order an Old Fashioned'),
  ('60000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000032', 2, 'Great cocktails and small plates on Courtenay Place'),
  ('60000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000019', 3, 'Live music until late on Cuba Street'),
  ('60000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000020', 4, 'Intimate venue with the best sound in the city'),
  ('60000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000021', 5, 'Heavy music until the early hours'),
  ('60000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000038', 6, 'Cuba Street bar with a great courtyard'),
  ('60000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000050', 7, 'End the night with cocktails on Tory Street'),

  -- Wellington Walks & Viewpoints
  ('60000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000017', 0, '15 minutes from the city to a panoramic view. Essential'),
  ('60000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000101', 1, 'The highest point in the town belt. 360° views on a clear day'),
  ('60000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000103', 2, 'Quiet native bush walk with harbour views'),
  ('60000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000104', 3, '5.5km loop walk — no retracing steps'),
  ('60000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000016', 4, 'Beautiful gardens with city views from the top'),
  ('60000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000045', 5, 'Hundreds of hectares of bush trails around the city'),
  ('60000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000014', 6, 'Walk up alongside the cable car track for a workout with a view'),

  -- Waterfront Wellington
  ('60000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000044', 0, 'Start at Frank Kitts — playground, views, and weekend markets'),
  ('60000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000040', 1, 'Free museum in a gorgeous heritage building'),
  ('60000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000013', 2, 'Te Papa is right on the waterfront. Don''t miss it'),
  ('60000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000043', 3, 'Skatepark, open spaces, and summer vibes'),
  ('60000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000046', 4, 'Professional theatre with harbour views from the bar'),
  ('60000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000018', 5, 'Walk all the way to Oriental Bay for the best sunset spot'),
  ('60000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000049', 6, 'Cultural centre and event space with stunning views'),

  -- Rainy Day Wellington
  ('60000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000013', 0, 'You could spend all day here and still not see everything'),
  ('60000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000042', 1, 'Free contemporary art in a beautiful space'),
  ('60000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000040', 2, 'Wellington''s history brought to life'),
  ('60000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000041', 3, 'Planetarium show at the top of the Botanic Garden'),
  ('60000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000001', 4, 'Hunker down with a great flat white'),
  ('60000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000024', 5, 'Beautiful cafe space — perfect for lingering'),
  ('60000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000022', 6, 'Catch a show at BATS — intimate and always surprising'),
  ('60000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000047', 7, 'The grand old Opera House for a matinee')
ON CONFLICT DO NOTHING;

-- ============================================================
-- FOLLOWS — everyone follows @welly + more cross-follows
-- ============================================================
INSERT INTO follows (follower_id, following_id) VALUES
  -- All users follow @welly
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000011'),
  -- @welly follows a few key accounts back
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000006'),
  -- Cross-follows between existing users (organic-feeling network)
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000009'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000009'),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000006'),
  ('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000007'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000009'),
  -- u1 (you) gets more followers
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001'),
  -- u1 follows more people
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007')
ON CONFLICT DO NOTHING;

-- ============================================================
-- HASHTAGS — additional tags for new content
-- ============================================================
INSERT INTO hashtags (id, name) VALUES
  ('50000000-0000-0000-0000-000000000030', 'thorndon'),
  ('50000000-0000-0000-0000-000000000031', 'tearo'),
  ('50000000-0000-0000-0000-000000000032', 'seafood'),
  ('50000000-0000-0000-0000-000000000033', 'cocktails'),
  ('50000000-0000-0000-0000-000000000034', 'dumplings'),
  ('50000000-0000-0000-0000-000000000035', 'malaysian'),
  ('50000000-0000-0000-0000-000000000036', 'byo'),
  ('50000000-0000-0000-0000-000000000037', 'theatre'),
  ('50000000-0000-0000-0000-000000000038', 'heritage'),
  ('50000000-0000-0000-0000-000000000039', 'cultural'),
  ('50000000-0000-0000-0000-000000000040', 'goldenhour'),
  ('50000000-0000-0000-0000-000000000041', 'trails'),
  ('50000000-0000-0000-0000-000000000042', 'conservation'),
  ('50000000-0000-0000-0000-000000000043', 'sunset'),
  ('50000000-0000-0000-0000-000000000044', 'torystreet'),
  ('50000000-0000-0000-0000-000000000045', 'courtenaypla'),
  ('50000000-0000-0000-0000-000000000046', 'space'),
  ('50000000-0000-0000-0000-000000000047', 'orientalbay'),
  ('50000000-0000-0000-0000-000000000048', 'trailrunning'),
  ('50000000-0000-0000-0000-000000000049', 'kids'),
  ('50000000-0000-0000-0000-000000000050', 'community'),
  ('50000000-0000-0000-0000-000000000051', 'everybodyeats')
ON CONFLICT DO NOTHING;

-- ── Post hashtag links for @welly posts ──
INSERT INTO post_hashtags (post_id, hashtag_id) VALUES
  -- Hillside Kitchen
  ('20000000-0000-0000-0000-000000000100', '50000000-0000-0000-0000-000000000017'), -- #hiddengem
  ('20000000-0000-0000-0000-000000000100', '50000000-0000-0000-0000-000000000030'), -- #thorndon
  -- Egmont Street Deli
  ('20000000-0000-0000-0000-000000000101', '50000000-0000-0000-0000-000000000014'), -- #brunch
  ('20000000-0000-0000-0000-000000000101', '50000000-0000-0000-0000-000000000031'), -- #tearo
  -- Ortega Fish Shack
  ('20000000-0000-0000-0000-000000000102', '50000000-0000-0000-0000-000000000019'), -- #finedining
  ('20000000-0000-0000-0000-000000000102', '50000000-0000-0000-0000-000000000032'), -- #seafood
  -- Capitol
  ('20000000-0000-0000-0000-000000000103', '50000000-0000-0000-0000-000000000019'), -- #finedining
  ('20000000-0000-0000-0000-000000000103', '50000000-0000-0000-0000-000000000020'), -- #nzfood
  -- Dragonfly
  ('20000000-0000-0000-0000-000000000104', '50000000-0000-0000-0000-000000000033'), -- #cocktails
  ('20000000-0000-0000-0000-000000000104', '50000000-0000-0000-0000-000000000045'), -- #courtenaypla
  -- Mr Go's
  ('20000000-0000-0000-0000-000000000105', '50000000-0000-0000-0000-000000000034'), -- #dumplings
  ('20000000-0000-0000-0000-000000000105', '50000000-0000-0000-0000-000000000036'), -- #byo
  -- KK Malaysian
  ('20000000-0000-0000-0000-000000000106', '50000000-0000-0000-0000-000000000035'), -- #malaysian
  ('20000000-0000-0000-0000-000000000106', '50000000-0000-0000-0000-000000000017'), -- #hiddengem
  -- Fork & Brewer
  ('20000000-0000-0000-0000-000000000107', '50000000-0000-0000-0000-000000000004'), -- #craftbeer
  ('20000000-0000-0000-0000-000000000107', '50000000-0000-0000-0000-000000000018'), -- #pizza
  -- Little Beer Quarter
  ('20000000-0000-0000-0000-000000000108', '50000000-0000-0000-0000-000000000004'), -- #craftbeer
  ('20000000-0000-0000-0000-000000000108', '50000000-0000-0000-0000-000000000031'), -- #tearo
  -- Laundry
  ('20000000-0000-0000-0000-000000000109', '50000000-0000-0000-0000-000000000013'), -- #cubastreet
  ('20000000-0000-0000-0000-000000000109', '50000000-0000-0000-0000-000000000012'), -- #livemusic
  -- Wellington Museum
  ('20000000-0000-0000-0000-000000000110', '50000000-0000-0000-0000-000000000008'), -- #freeentry
  ('20000000-0000-0000-0000-000000000110', '50000000-0000-0000-0000-000000000021'), -- #waterfront
  -- Space Place
  ('20000000-0000-0000-0000-000000000111', '50000000-0000-0000-0000-000000000046'), -- #space
  ('20000000-0000-0000-0000-000000000111', '50000000-0000-0000-0000-000000000015'), -- #botanicgarden
  -- Frank Kitts Park
  ('20000000-0000-0000-0000-000000000112', '50000000-0000-0000-0000-000000000021'), -- #waterfront
  ('20000000-0000-0000-0000-000000000112', '50000000-0000-0000-0000-000000000040'), -- #goldenhour
  -- Town Belt
  ('20000000-0000-0000-0000-000000000113', '50000000-0000-0000-0000-000000000016'), -- #nature
  ('20000000-0000-0000-0000-000000000113', '50000000-0000-0000-0000-000000000041'), -- #trails
  -- Circa Theatre
  ('20000000-0000-0000-0000-000000000114', '50000000-0000-0000-0000-000000000037'), -- #theatre
  ('20000000-0000-0000-0000-000000000114', '50000000-0000-0000-0000-000000000021'), -- #waterfront
  -- Opera House
  ('20000000-0000-0000-0000-000000000115', '50000000-0000-0000-0000-000000000038'), -- #heritage
  ('20000000-0000-0000-0000-000000000115', '50000000-0000-0000-0000-000000000037'), -- #theatre
  -- Wharewaka
  ('20000000-0000-0000-0000-000000000116', '50000000-0000-0000-0000-000000000039'), -- #cultural
  ('20000000-0000-0000-0000-000000000116', '50000000-0000-0000-0000-000000000021'), -- #waterfront
  -- Caroline
  ('20000000-0000-0000-0000-000000000117', '50000000-0000-0000-0000-000000000033'), -- #cocktails
  ('20000000-0000-0000-0000-000000000117', '50000000-0000-0000-0000-000000000044'), -- #torystreet
  -- Everybody Eats
  ('20000000-0000-0000-0000-000000000118', '50000000-0000-0000-0000-000000000050'), -- #community
  ('20000000-0000-0000-0000-000000000118', '50000000-0000-0000-0000-000000000051'), -- #everybodyeats
  -- Raglan Roast
  ('20000000-0000-0000-0000-000000000119', '50000000-0000-0000-0000-000000000001'), -- #coffee
  ('20000000-0000-0000-0000-000000000119', '50000000-0000-0000-0000-000000000031'), -- #tearo
  -- Mojo Coffee
  ('20000000-0000-0000-0000-000000000120', '50000000-0000-0000-0000-000000000001'), -- #coffee
  ('20000000-0000-0000-0000-000000000120', '50000000-0000-0000-0000-000000000005'), -- #wellington
  -- Memphis Belle
  ('20000000-0000-0000-0000-000000000121', '50000000-0000-0000-0000-000000000014'), -- #brunch
  ('20000000-0000-0000-0000-000000000121', '50000000-0000-0000-0000-000000000045'), -- #courtenaypla
  -- Northern Walkway
  ('20000000-0000-0000-0000-000000000122', '50000000-0000-0000-0000-000000000041'), -- #trails
  ('20000000-0000-0000-0000-000000000122', '50000000-0000-0000-0000-000000000016'), -- #nature
  ('20000000-0000-0000-0000-000000000122', '50000000-0000-0000-0000-000000000005'), -- #wellington
  -- Wellington overview
  ('20000000-0000-0000-0000-000000000130', '50000000-0000-0000-0000-000000000005'), -- #wellington
  ('20000000-0000-0000-0000-000000000130', '50000000-0000-0000-0000-000000000047'), -- #orientalbay
  -- Cuba Street spotlight
  ('20000000-0000-0000-0000-000000000131', '50000000-0000-0000-0000-000000000013'), -- #cubastreet
  ('20000000-0000-0000-0000-000000000131', '50000000-0000-0000-0000-000000000005'), -- #wellington
  -- Zealandia feature
  ('20000000-0000-0000-0000-000000000132', '50000000-0000-0000-0000-000000000023'), -- #zealandia
  ('20000000-0000-0000-0000-000000000132', '50000000-0000-0000-0000-000000000024'), -- #wildlife
  ('20000000-0000-0000-0000-000000000132', '50000000-0000-0000-0000-000000000042'), -- #conservation
  -- Te Papa feature
  ('20000000-0000-0000-0000-000000000133', '50000000-0000-0000-0000-000000000006'), -- #tepapa
  ('20000000-0000-0000-0000-000000000133', '50000000-0000-0000-0000-000000000008'), -- #freeentry
  ('20000000-0000-0000-0000-000000000133', '50000000-0000-0000-0000-000000000007'), -- #art
  -- Mt Vic feature
  ('20000000-0000-0000-0000-000000000134', '50000000-0000-0000-0000-000000000010'), -- #mtvic
  ('20000000-0000-0000-0000-000000000134', '50000000-0000-0000-0000-000000000011'), -- #views
  ('20000000-0000-0000-0000-000000000134', '50000000-0000-0000-0000-000000000043') -- #sunset
ON CONFLICT DO NOTHING;

-- ============================================================
-- GUIDE LIKES for @welly guides
-- Note: The trigger auto-updates denormalized likes count on guides.
-- ============================================================
INSERT INTO guide_likes (guide_id, user_id, created_at) VALUES
  -- Essential Wellington (popular — 8 likes)
  ('60000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', (CURRENT_DATE - 3) + TIME '10:00:00'),
  ('60000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', (CURRENT_DATE - 3) + TIME '11:00:00'),
  ('60000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003', (CURRENT_DATE - 2) + TIME '09:00:00'),
  ('60000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004', (CURRENT_DATE - 2) + TIME '14:00:00'),
  ('60000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000005', (CURRENT_DATE - 2) + TIME '15:00:00'),
  ('60000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000006', (CURRENT_DATE - 1) + TIME '08:00:00'),
  ('60000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000008', (CURRENT_DATE - 1) + TIME '12:00:00'),
  ('60000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', CURRENT_DATE + TIME '09:00:00'),
  -- Cuba Street (6 likes)
  ('60000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', (CURRENT_DATE - 2) + TIME '10:00:00'),
  ('60000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000004', (CURRENT_DATE - 2) + TIME '15:00:00'),
  ('60000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000009', (CURRENT_DATE - 1) + TIME '20:00:00'),
  ('60000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000010', (CURRENT_DATE - 1) + TIME '21:00:00'),
  ('60000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', CURRENT_DATE + TIME '08:00:00'),
  ('60000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000007', CURRENT_DATE + TIME '12:00:00'),
  -- Free Things (7 likes)
  ('60000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', (CURRENT_DATE - 2) + TIME '11:00:00'),
  ('60000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000003', (CURRENT_DATE - 2) + TIME '14:00:00'),
  ('60000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000006', (CURRENT_DATE - 1) + TIME '09:00:00'),
  ('60000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000008', (CURRENT_DATE - 1) + TIME '13:00:00'),
  ('60000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000005', (CURRENT_DATE - 1) + TIME '16:00:00'),
  ('60000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000009', CURRENT_DATE + TIME '10:00:00'),
  ('60000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000010', CURRENT_DATE + TIME '11:00:00'),
  -- Wellington for Foodies (5 likes)
  ('60000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000002', (CURRENT_DATE - 2) + TIME '12:00:00'),
  ('60000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', (CURRENT_DATE - 1) + TIME '19:00:00'),
  ('60000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000008', (CURRENT_DATE - 1) + TIME '20:00:00'),
  ('60000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000005', CURRENT_DATE + TIME '08:00:00'),
  ('60000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000003', CURRENT_DATE + TIME '15:00:00'),
  -- Late Night (4 likes)
  ('60000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000009', (CURRENT_DATE - 1) + TIME '22:00:00'),
  ('60000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000004', (CURRENT_DATE - 1) + TIME '23:00:00'),
  ('60000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000007', CURRENT_DATE + TIME '18:00:00'),
  ('60000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000010', CURRENT_DATE + TIME '20:00:00'),
  -- Walks & Viewpoints (5 likes)
  ('60000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000006', (CURRENT_DATE - 2) + TIME '07:00:00'),
  ('60000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', (CURRENT_DATE - 1) + TIME '09:00:00'),
  ('60000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000003', (CURRENT_DATE - 1) + TIME '16:00:00'),
  ('60000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000008', CURRENT_DATE + TIME '10:00:00'),
  ('60000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000005', CURRENT_DATE + TIME '14:00:00'),
  -- Waterfront (3 likes)
  ('60000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', (CURRENT_DATE - 1) + TIME '12:00:00'),
  ('60000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000008', (CURRENT_DATE - 1) + TIME '15:00:00'),
  ('60000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000003', CURRENT_DATE + TIME '11:00:00'),
  -- Rainy Day (6 likes)
  ('60000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', (CURRENT_DATE - 2) + TIME '10:00:00'),
  ('60000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000002', (CURRENT_DATE - 2) + TIME '11:00:00'),
  ('60000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000005', (CURRENT_DATE - 1) + TIME '09:00:00'),
  ('60000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000008', (CURRENT_DATE - 1) + TIME '14:00:00'),
  ('60000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000003', CURRENT_DATE + TIME '13:00:00'),
  ('60000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000010', CURRENT_DATE + TIME '15:00:00')
ON CONFLICT DO NOTHING;

-- ============================================================
-- GUIDE COMMENTS for @welly guides
-- ============================================================
INSERT INTO guide_comments (id, guide_id, user_id, text, created_at) VALUES
  ('70000000-0000-0000-0000-000000000010', '60000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002',
   'This is perfect for visitors! Sharing with my friends coming to Wellington next month.', (CURRENT_DATE - 2) + TIME '12:00:00'),
  ('70000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000006',
   'Solid list. I''d add the Northern Walkway if you''re into walks!', (CURRENT_DATE - 2) + TIME '14:00:00'),
  ('70000000-0000-0000-0000-000000000012', '60000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000004',
   'Cuba Street is the best street in NZ. This guide nails it.', (CURRENT_DATE - 1) + TIME '18:00:00'),
  ('70000000-0000-0000-0000-000000000013', '60000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000008',
   'Love that you included Everybody Eats! Such an important initiative.', (CURRENT_DATE - 1) + TIME '15:00:00'),
  ('70000000-0000-0000-0000-000000000014', '60000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000005',
   'Mr Go''s dumplings are insanely good. Great call including them.', (CURRENT_DATE - 1) + TIME '20:00:00'),
  ('70000000-0000-0000-0000-000000000015', '60000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000009',
   'This is basically my Friday night route. Can confirm it works.', (CURRENT_DATE - 1) + TIME '23:00:00'),
  ('70000000-0000-0000-0000-000000000016', '60000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000003',
   'The Northern Walkway loop is so underrated. Great photos from the top!', CURRENT_DATE + TIME '09:00:00'),
  ('70000000-0000-0000-0000-000000000017', '60000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000010',
   'We definitely need this guide in Wellington. Bookmarked for the next southerly!', CURRENT_DATE + TIME '14:00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- COMMENTS on @welly posts (engagement)
-- ============================================================
INSERT INTO comments (id, post_id, user_id, text, created_at) VALUES
  ('30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000002',
   'Hillside is incredible! Their seasonal menu changes are always worth checking out.', (CURRENT_DATE - 8) + TIME '13:00:00'),
  ('30000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000005',
   'The pastrami sandwich changed my life. Not exaggerating.', (CURRENT_DATE - 7) + TIME '12:30:00'),
  ('30000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000008',
   'Mr Go''s is the best value meal in Wellington. Take your own wine!', (CURRENT_DATE - 4) + TIME '20:00:00'),
  ('30000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000118', '00000000-0000-0000-0000-000000000006',
   'Everybody Eats is everything that''s good about this city. Love it.', (CURRENT_DATE - 1) + TIME '20:00:00'),
  ('30000000-0000-0000-0000-000000000024', '20000000-0000-0000-0000-000000000118', '00000000-0000-0000-0000-000000000001',
   'Went last week. Three courses of rescued food and it was genuinely delicious.', (CURRENT_DATE - 1) + TIME '20:30:00'),
  ('30000000-0000-0000-0000-000000000025', '20000000-0000-0000-0000-000000000130', '00000000-0000-0000-0000-000000000003',
   'Best little capital in the world. Couldn''t agree more.', (CURRENT_DATE - 14) + TIME '19:00:00'),
  ('30000000-0000-0000-0000-000000000026', '20000000-0000-0000-0000-000000000132', '00000000-0000-0000-0000-000000000006',
   'The night tour is magical. We heard a kiwi calling right near the path!', (CURRENT_DATE - 9) + TIME '08:00:00'),
  ('30000000-0000-0000-0000-000000000027', '20000000-0000-0000-0000-000000000134', '00000000-0000-0000-0000-000000000001',
   'Sunset from Mt Vic is unbeatable. My favourite 15-minute walk.', (CURRENT_DATE - 10) + TIME '20:00:00'),
  ('30000000-0000-0000-0000-000000000028', '20000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000004',
   'The Laundry courtyard on a summer night is pure magic.', (CURRENT_DATE - 7) + TIME '22:00:00'),
  ('30000000-0000-0000-0000-000000000029', '20000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000002',
   'The ceviche at Ortega is one of the best dishes in Wellington.', (CURRENT_DATE - 6) + TIME '20:30:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- POST LIKES — add likes for @welly and new posts
-- These trigger auto-updates to the denormalized likes count.
-- NOTE: Since we SET likes directly in the INSERT above, these
-- trigger increments may cause counts to be higher than expected.
-- For production, either set likes=0 in INSERT and use only
-- post_likes, or skip this section.
-- ============================================================

-- Done! Content seed complete.
-- Summary:
--   @welly account: 1 curator profile
--   @welly posts: 28 editorial posts covering previously uncovered places
--   Additional posts: 10 posts from existing users filling coverage gaps
--   @welly guides: 8 curated guides (Essential, Cuba St, Free, Foodies, Late Night, Walks, Waterfront, Rainy Day)
--   Follows: All users follow @welly + 20+ cross-follows
--   Engagement: 44 guide likes, 8 guide comments, 10 post comments, 22 hashtags
