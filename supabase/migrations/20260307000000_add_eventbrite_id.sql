-- Add Eventbrite external ID and URL columns to events table
alter table events add column eventbrite_id text unique;
alter table events add column eventbrite_url text;

create index events_eventbrite_id_idx on events(eventbrite_id) where eventbrite_id is not null;
