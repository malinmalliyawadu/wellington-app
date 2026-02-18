-- Add 'trail' to place_category enum and link trails to shadow place records
-- This allows trails to support posts, likes, and events via the existing place infrastructure.

-- 1. Add 'trail' to place_category enum (safe if already present)
ALTER TYPE place_category ADD VALUE IF NOT EXISTS 'trail';

-- 2. Add place_id column to trails table if it doesn't exist
DO $$ BEGIN
  ALTER TABLE trails ADD COLUMN place_id UUID REFERENCES places(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. Create shadow place records for existing trails (skip if already present)
INSERT INTO places (id, name, category, address, latitude, longitude) VALUES
  ('10000000-0000-0000-0000-000000000101', 'Mt Kaukau', 'trail', 'Simla Crescent, Khandallah', -41.2478, 174.7692),
  ('10000000-0000-0000-0000-000000000102', 'Mt Victoria Lookout', 'trail', 'Majoribanks Street, Mt Victoria', -41.2935, 174.7835),
  ('10000000-0000-0000-0000-000000000103', 'Te Ahumairangi Hill', 'trail', 'Bolton Street, Thorndon', -41.277, 174.77),
  ('10000000-0000-0000-0000-000000000104', 'Northern Walkway Loop', 'trail', 'Botanic Garden, Thorndon', -41.2845, 174.768)
ON CONFLICT (id) DO NOTHING;

-- 4. Backfill place_id on existing trails (only if null)
UPDATE trails SET place_id = '10000000-0000-0000-0000-000000000101' WHERE id = 'a1b2c3d4-0001-4000-8000-000000000001' AND place_id IS NULL;
UPDATE trails SET place_id = '10000000-0000-0000-0000-000000000102' WHERE id = 'a1b2c3d4-0002-4000-8000-000000000002' AND place_id IS NULL;
UPDATE trails SET place_id = '10000000-0000-0000-0000-000000000103' WHERE id = 'a1b2c3d4-0003-4000-8000-000000000003' AND place_id IS NULL;
UPDATE trails SET place_id = '10000000-0000-0000-0000-000000000104' WHERE id = 'a1b2c3d4-0004-4000-8000-000000000004' AND place_id IS NULL;

-- 5. Set NOT NULL constraint if not already set
DO $$ BEGIN
  ALTER TABLE trails ALTER COLUMN place_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 6. Add UNIQUE constraint if not already present
DO $$ BEGIN
  ALTER TABLE trails ADD CONSTRAINT trails_place_id_unique UNIQUE (place_id);
EXCEPTION WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;
