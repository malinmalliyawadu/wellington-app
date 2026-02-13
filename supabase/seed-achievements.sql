-- Seed achievement definitions
-- Run this after running add-exploration-achievements.sql

INSERT INTO achievement_definitions (id, type, title, description, icon_name, requirement, badge_color, sort_order) VALUES
-- Category achievements
('cafe_explorer', 'category', 'Cafe Connoisseur', 'Visited all cafes in Wellington', 'coffee', '{"category": "cafe"}', '#8B4513', 1),
('restaurant_explorer', 'category', 'Foodie', 'Visited all restaurants in Wellington', 'restaurant', '{"category": "restaurant"}', '#FF6B35', 2),
('bar_explorer', 'category', 'Bar Hopper', 'Visited all bars in Wellington', 'wine-bar', '{"category": "bar"}', '#9B59B6', 3),
('attraction_explorer', 'category', 'Tourist', 'Visited all attractions in Wellington', 'attractions', '{"category": "attraction"}', '#3498DB', 4),
('park_explorer', 'category', 'Nature Lover', 'Visited all parks in Wellington', 'park', '{"category": "park"}', '#27AE60', 5),
('venue_explorer', 'category', 'Event Enthusiast', 'Visited all event venues in Wellington', 'event', '{"category": "venue"}', '#E74C3C', 6),

-- Milestone achievements
('explorer_5', 'milestone', 'Getting Started', 'Explored 5 places in Wellington', 'star', '{"count": 5}', '#95A5A6', 7),
('explorer_10', 'milestone', 'Explorer', 'Explored 10 places in Wellington', 'star', '{"count": 10}', '#E67E22', 8),
('explorer_15', 'milestone', 'Adventurer', 'Explored 15 places in Wellington', 'star', '{"count": 15}', '#F39C12', 9),
('local_legend_22', 'milestone', 'Local Legend', 'Explored all 22 places in Wellington', 'star', '{"count": 22}', '#FFD700', 10),

-- Neighborhood achievements
('cbd_explorer', 'neighborhood', 'CBD Explorer', 'Visited all places in the CBD', 'location-city', '{"neighborhood": "cbd"}', '#34495E', 11),
('te_aro_explorer', 'neighborhood', 'Te Aro Local', 'Visited all places in Te Aro', 'location-city', '{"neighborhood": "te_aro"}', '#16A085', 12),
('mount_victoria_explorer', 'neighborhood', 'Mount Victoria Climber', 'Visited all places in Mount Victoria', 'terrain', '{"neighborhood": "mount_victoria"}', '#27AE60', 13),
('waterfront_explorer', 'neighborhood', 'Waterfront Wanderer', 'Visited all places on the Waterfront', 'waves', '{"neighborhood": "waterfront"}', '#3498DB', 14),
('thorndon_explorer', 'neighborhood', 'Thorndon Trekker', 'Visited all places in Thorndon', 'location-city', '{"neighborhood": "thorndon"}', '#8E44AD', 15),

-- Social achievements
('first_explorer', 'social', 'First Explorer', 'Be the first among your friends to discover a place', 'flag', '{"type": "first_to_discover"}', '#E74C3C', 16),
('social_butterfly', 'social', 'Social Butterfly', 'Visit 5 places where friends have posted', 'people', '{"type": "visit_friend_places", "count": 5}', '#F39C12', 17),
('friend_tracker', 'social', 'Friend Tracker', 'Visit a place within 24 hours of a friend', 'near-me', '{"type": "visit_within_24h"}', '#9B59B6', 18)
ON CONFLICT (id) DO NOTHING;
