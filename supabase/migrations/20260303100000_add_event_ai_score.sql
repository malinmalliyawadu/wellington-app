ALTER TABLE events ADD COLUMN ai_score smallint;
ALTER TABLE events ADD COLUMN ai_score_reason text;
CREATE INDEX events_ai_score_idx ON events(ai_score DESC NULLS LAST);
