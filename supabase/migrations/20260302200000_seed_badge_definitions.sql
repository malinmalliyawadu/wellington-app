-- Add new badge types to the achievement_type enum
ALTER TYPE achievement_type ADD VALUE IF NOT EXISTS 'level';
ALTER TYPE achievement_type ADD VALUE IF NOT EXISTS 'activity';
ALTER TYPE achievement_type ADD VALUE IF NOT EXISTS 'wellington';

-- Seed the 24 new badge definitions
-- Level Badges (10)
INSERT INTO achievement_definitions (id, type, title, description, icon_name, requirement, badge_color, sort_order)
VALUES
  ('level_1',  'level', 'Newcomer',          'Welcome to Wellington!',          '👋', '{"type":"level","level":1}',  '#95A5A6', 101),
  ('level_2',  'level', 'Visitor',            'Reached Level 2',                '🎒', '{"type":"level","level":2}',  '#7F8C8D', 102),
  ('level_3',  'level', 'Local',              'Reached Level 3',                '🏠', '{"type":"level","level":3}',  '#27AE60', 103),
  ('level_4',  'level', 'Explorer',           'Reached Level 4',                '🧭', '{"type":"level","level":4}',  '#2980B9', 104),
  ('level_5',  'level', 'Insider',            'Reached Level 5',                '🔑', '{"type":"level","level":5}',  '#8E44AD', 105),
  ('level_6',  'level', 'Ambassador',         'Reached Level 6',                '🌟', '{"type":"level","level":6}',  '#E67E22', 106),
  ('level_7',  'level', 'Trailblazer',        'Reached Level 7',                '🔥', '{"type":"level","level":7}',  '#E74C3C', 107),
  ('level_8',  'level', 'Legend',             'Reached Level 8',                '⚡', '{"type":"level","level":8}',  '#F39C12', 108),
  ('level_9',  'level', 'Icon',              'Reached Level 9',                '💎', '{"type":"level","level":9}',  '#D4930D', 109),
  ('level_10', 'level', 'Wellington Master',  'Reached Level 10',               '👑', '{"type":"level","level":10}', '#FFD700', 110)
ON CONFLICT (id) DO NOTHING;

-- Activity Badges (8)
INSERT INTO achievement_definitions (id, type, title, description, icon_name, requirement, badge_color, sort_order)
VALUES
  ('first_post',       'activity', 'First Post',        'Create your first post',        '📝', '{"type":"action_count","actionType":"post_photo","count":1}',    '#3498DB', 111),
  ('storyteller',      'activity', 'Storyteller',       'Create 10 posts',               '📖', '{"type":"action_count","actionType":"post_photo","count":10}',   '#2980B9', 112),
  ('crowd_favorite',   'activity', 'Crowd Favorite',    'Receive 50 likes total',        '❤️', '{"type":"action_count","actionType":"like_received","count":50}', '#E0245E', 113),
  ('social_connector', 'activity', 'Social Connector',  'Follow 10 people',              '🤝', '{"type":"action_count","actionType":"follow","count":10}',       '#8E44AD', 114),
  ('commentator',      'activity', 'Commentator',       'Write 25 comments',             '💬', '{"type":"action_count","actionType":"comment","count":25}',      '#16A085', 115),
  ('event_goer',       'activity', 'Event Goer',        'Attend 5 events',               '🎉', '{"type":"action_count","actionType":"event_attend","count":5}',  '#E67E22', 116),
  ('pioneer',          'activity', 'Pioneer',           'Be first to discover 3 places', '🚩', '{"type":"action_count","actionType":"first_discover","count":3}','#E74C3C', 117),
  ('content_creator',  'activity', 'Content Creator',   'Create 5 events',               '🎪', '{"type":"action_count","actionType":"event_create","count":5}',  '#9B59B6', 118)
ON CONFLICT (id) DO NOTHING;

-- Wellington Badges (6)
INSERT INTO achievement_definitions (id, type, title, description, icon_name, requirement, badge_color, sort_order)
VALUES
  ('cafe_culture',   'wellington', 'Cafe Culture',   'Explore 5 cafes',                            '☕', '{"type":"category_explore","category":"cafe","count":5}',                                     '#8B4513', 119),
  ('night_owl',      'wellington', 'Night Owl',      'Explore 5 bars',                             '🦉', '{"type":"category_explore","category":"bar","count":5}',                                      '#9B59B6', 120),
  ('nature_walker',  'wellington', 'Nature Walker',  'Explore 5 parks or trails',                  '🌿', '{"type":"category_explore","category":"park","count":5}',                                     '#27AE60', 121),
  ('foodie_badge',   'wellington', 'Foodie',         'Explore 5 restaurants',                      '🍽️', '{"type":"category_explore","category":"restaurant","count":5}',                               '#E85D04', 122),
  ('culture_vulture','wellington', 'Culture Vulture','Attend 5 cultural, art, or music events',    '🎭', '{"type":"event_category","eventCategories":["cultural","art","music"],"count":5}',             '#B91C1C', 123),
  ('all_rounder',    'wellington', 'All-Rounder',    'Earn points from all action types',          '🏆', '{"type":"all_actions"}',                                                                      '#FFD700', 124)
ON CONFLICT (id) DO NOTHING;
