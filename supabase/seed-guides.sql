-- Seed guides data (run after migration 20260222200000_add_guides.sql)

insert into guides (id, user_id, title, description) values
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
   'Best Brunch Spots in Wellington',
   'My favourite places for a lazy weekend brunch. These cafes never disappoint!'),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005',
   'Wellington Coffee Trail',
   'The definitive guide to specialty coffee in Wellington. Work your way through these and thank me later.'),
  ('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000007',
   'Craft Beer Crawl',
   'The ultimate Wellington craft beer crawl. Start early, pace yourself, and enjoy the best brews in town.'),
  ('60000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002',
   'Date Night Spots',
   'Impress your date with these Wellington gems. From cosy bars to fine dining.'),
  ('60000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006',
   'Best Views in Wellington',
   'Wellington has incredible viewpoints. Here are the best spots to take it all in.')
on conflict (id) do nothing;

insert into guide_places (guide_id, place_id, sort_order, note) values
  -- Best Brunch Spots (sarah_eats_welly)
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 0, 'The ricotta hotcakes are legendary'),
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 1, 'Great cabinet food and excellent coffee'),
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 2, 'Hidden gem in Thorndon with amazing seasonal menu'),
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000028', 3, 'Classic Wellington vibes'),
  -- Wellington Coffee Trail (coffeesnob_nz)
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 0, 'Best flat white in the city, hands down'),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 1, 'The OG specialty coffee spot'),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000023', 2, 'Ethical and delicious — try the cold brew'),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000024', 3, 'Beautiful space, incredible pour-over'),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000025', 4, 'Great beans from Raglan, solid espresso'),
  -- Craft Beer Crawl (craft_beer_sam)
  ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000039', 0, 'Start here — always rotating taps of the freshest brews'),
  ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000010', 1, 'Dive bar vibes with excellent NZ craft selection'),
  ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000009', 2, 'Japanese beer imports you won''t find anywhere else'),
  ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000037', 3, 'Good food to soak it up and solid tap list'),
  ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000012', 4, 'End here — great beer garden if the weather''s good'),
  -- Date Night Spots (sarah_eats_welly)
  ('60000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000035', 0, 'Start with cocktails — the atmosphere is unreal'),
  ('60000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000029', 1, 'Classic fine dining, never disappoints'),
  ('60000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000011', 2, 'Secret bar for after-dinner drinks'),
  ('60000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000006', 3, 'For a truly special occasion — indigenous NZ cuisine'),
  -- Best Views (welly_walks)
  ('60000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000017', 0, 'The classic Wellington panorama'),
  ('60000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000014', 1, 'Ride the cable car up for great harbour views'),
  ('60000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000016', 2, 'Wander through the gardens and enjoy the city below'),
  ('60000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000018', 3, 'Sunset from Oriental Bay is magical')
on conflict (guide_id, place_id) do nothing;
