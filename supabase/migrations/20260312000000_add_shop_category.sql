-- Add 'shop' to place_category enum
ALTER TYPE place_category ADD VALUE IF NOT EXISTS 'shop';
