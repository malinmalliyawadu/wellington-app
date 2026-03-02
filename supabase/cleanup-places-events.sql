-- Delete all events
DELETE FROM events;

-- Delete places not referenced by posts, guides, or trails
DELETE FROM places
WHERE id NOT IN (SELECT DISTINCT place_id FROM posts)
  AND id NOT IN (SELECT DISTINCT place_id FROM guide_places)
  AND id NOT IN (SELECT DISTINCT place_id FROM trails)
  AND category != 'trail';
