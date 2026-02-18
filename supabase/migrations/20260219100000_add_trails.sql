-- Trail difficulty enum
CREATE TYPE trail_difficulty AS ENUM ('easy', 'moderate', 'hard');

-- Trails table
CREATE TABLE trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  elevation TEXT NOT NULL,
  distance TEXT NOT NULL,
  duration TEXT NOT NULL,
  difficulty trail_difficulty NOT NULL,
  highlights JSONB NOT NULL DEFAULT '[]',
  trailhead JSONB NOT NULL,
  coordinates JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: public read
ALTER TABLE trails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trails_public_read" ON trails
  FOR SELECT USING (true);

-- Seed data: 4 Wellington hiking trails
INSERT INTO trails (id, name, description, elevation, distance, duration, difficulty, highlights, trailhead, coordinates) VALUES
(
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Mt Kaukau',
  'The highest point in the Wellington Town Belt, Mt Kaukau offers panoramic 360° views of Wellington Harbour, the Hutt Valley, and the Tararua Range. The well-maintained track climbs steadily through regenerating bush before opening up to tussock-covered slopes near the summit.',
  '445m',
  '3.6km return',
  '1.5–2 hrs',
  'moderate',
  '["360° panoramic views from the summit", "Native bush and tussock grassland", "Views of Wellington Harbour and South Island", "Transmission tower landmark at summit"]',
  '{"latitude": -41.2478, "longitude": 174.7692, "label": "Simla Crescent, Khandallah"}',
  '[{"latitude": -41.2478, "longitude": 174.7692}, {"latitude": -41.247, "longitude": 174.7685}, {"latitude": -41.246, "longitude": 174.7675}, {"latitude": -41.2448, "longitude": 174.7668}, {"latitude": -41.2435, "longitude": 174.766}, {"latitude": -41.242, "longitude": 174.7652}, {"latitude": -41.2405, "longitude": 174.7647}, {"latitude": -41.239, "longitude": 174.764}, {"latitude": -41.2375, "longitude": 174.7633}, {"latitude": -41.236, "longitude": 174.7627}, {"latitude": -41.2345, "longitude": 174.7622}, {"latitude": -41.233, "longitude": 174.7618}, {"latitude": -41.2315, "longitude": 174.7615}, {"latitude": -41.23, "longitude": 174.7612}, {"latitude": -41.2287, "longitude": 174.7615}]'
),
(
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Mt Victoria Lookout',
  'A quick climb from the heart of the city to one of Wellington''s most iconic viewpoints. The track winds through mature pine forest and native bush before reaching the summit lookout with sweeping views over the city, harbour, and airport.',
  '196m',
  '2km return',
  '45 min–1 hr',
  'easy',
  '["Iconic city and harbour panorama", "Lord of the Rings filming location", "Pine forest and native bush", "Close to Courtenay Place and Oriental Bay"]',
  '{"latitude": -41.2935, "longitude": 174.7835, "label": "Majoribanks Street, Mt Victoria"}',
  '[{"latitude": -41.2935, "longitude": 174.7835}, {"latitude": -41.2938, "longitude": 174.7848}, {"latitude": -41.2942, "longitude": 174.786}, {"latitude": -41.2948, "longitude": 174.787}, {"latitude": -41.2955, "longitude": 174.7878}, {"latitude": -41.296, "longitude": 174.7888}, {"latitude": -41.2962, "longitude": 174.79}]'
),
(
  'a1b2c3d4-0003-4000-8000-000000000003',
  'Te Ahumairangi Hill',
  'Also known as Tinakori Hill, this peaceful bush walk starts from the Bolton Street Cemetery and climbs through regenerating native forest. The summit offers views across the city, harbour, and out to the Hutt Valley — without the crowds of Mt Victoria.',
  '306m',
  '3km return',
  '1–1.5 hrs',
  'easy',
  '["Quiet native bush walk minutes from the CBD", "Views over Wellington and the Hutt Valley", "Historic Bolton Street Cemetery at the start", "Rich birdlife — tui, kereru, and fantail"]',
  '{"latitude": -41.277, "longitude": 174.77, "label": "Bolton Street, Thorndon"}',
  '[{"latitude": -41.277, "longitude": 174.77}, {"latitude": -41.2758, "longitude": 174.769}, {"latitude": -41.2745, "longitude": 174.768}, {"latitude": -41.2732, "longitude": 174.7672}, {"latitude": -41.2718, "longitude": 174.7665}, {"latitude": -41.2705, "longitude": 174.766}, {"latitude": -41.269, "longitude": 174.7658}]'
),
(
  'a1b2c3d4-0004-4000-8000-000000000004',
  'Northern Walkway Loop',
  'A scenic loop from the Botanic Garden up and over Te Ahumairangi Hill, descending through Wadestown before looping back through Thorndon. The route passes through mature native bush, with views across the harbour and city from the ridgeline.',
  '306m',
  '5.5km loop',
  '2–2.5 hrs',
  'moderate',
  '["Loop trail — no retracing steps", "Crosses Te Ahumairangi Hill summit", "Native bush with tui and kereru", "Harbour views from the ridgeline"]',
  '{"latitude": -41.2845, "longitude": 174.768, "label": "Botanic Garden, Thorndon"}',
  '[{"latitude": -41.2845, "longitude": 174.768}, {"latitude": -41.2822, "longitude": 174.7675}, {"latitude": -41.28, "longitude": 174.7688}, {"latitude": -41.2778, "longitude": 174.7695}, {"latitude": -41.2755, "longitude": 174.769}, {"latitude": -41.2732, "longitude": 174.7678}, {"latitude": -41.271, "longitude": 174.7665}, {"latitude": -41.269, "longitude": 174.7658}, {"latitude": -41.2672, "longitude": 174.7648}, {"latitude": -41.2655, "longitude": 174.764}, {"latitude": -41.264, "longitude": 174.7652}, {"latitude": -41.2658, "longitude": 174.767}, {"latitude": -41.2675, "longitude": 174.7688}, {"latitude": -41.2698, "longitude": 174.7702}, {"latitude": -41.272, "longitude": 174.771}, {"latitude": -41.2745, "longitude": 174.7715}, {"latitude": -41.277, "longitude": 174.7712}, {"latitude": -41.2795, "longitude": 174.7705}, {"latitude": -41.282, "longitude": 174.7695}, {"latitude": -41.2845, "longitude": 174.768}]'
);
