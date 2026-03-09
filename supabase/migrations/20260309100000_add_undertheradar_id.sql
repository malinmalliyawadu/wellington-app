-- Add Under the Radar external sync ID
ALTER TABLE events ADD COLUMN undertheradar_id integer UNIQUE;
ALTER TABLE events ADD COLUMN undertheradar_url text;

CREATE INDEX events_undertheradar_id_idx ON events (undertheradar_id) WHERE undertheradar_id IS NOT NULL;
