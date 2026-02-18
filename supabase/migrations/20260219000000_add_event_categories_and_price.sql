-- Add new event categories: quiz, craft, kids, cultural
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'quiz';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'craft';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'kids';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'cultural';

-- Add price column to events (null = free)
ALTER TABLE events ADD COLUMN IF NOT EXISTS price numeric(8,2) DEFAULT NULL;
