-- Add ai_description column for AI-enriched event descriptions (markdown)
ALTER TABLE events ADD COLUMN IF NOT EXISTS ai_description text;
