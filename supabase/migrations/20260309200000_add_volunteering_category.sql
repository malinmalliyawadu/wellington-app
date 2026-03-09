-- Add 'volunteering' to the event_category enum
alter type event_category add value 'volunteering';

-- Add Everybody Eats external ID and URL columns to events table
alter table events add column everybody_eats_id text unique;
alter table events add column everybody_eats_url text;

create index events_everybody_eats_id_idx on events(everybody_eats_id) where everybody_eats_id is not null;
