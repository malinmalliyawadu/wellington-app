-- Add new event categories: quiz, craft, kids, cultural
ALTER TYPE event_category ADD VALUE 'quiz';
ALTER TYPE event_category ADD VALUE 'craft';
ALTER TYPE event_category ADD VALUE 'kids';
ALTER TYPE event_category ADD VALUE 'cultural';

-- Add price column to events (null = free)
ALTER TABLE events ADD COLUMN price numeric(8,2) DEFAULT NULL;
