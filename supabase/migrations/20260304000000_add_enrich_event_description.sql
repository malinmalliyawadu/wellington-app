-- RPC to update event description, bypassing RLS (for enrichment from client)
CREATE OR REPLACE FUNCTION enrich_event_description(event_id uuid, new_description text)
RETURNS void AS $$
BEGIN
  UPDATE events SET description = new_description WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
