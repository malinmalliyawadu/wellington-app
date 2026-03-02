-- Add Ticketmaster sync columns to events table
alter table events add column ticketmaster_id text unique;
alter table events add column ticketmaster_url text;

create index events_ticketmaster_id_idx on events(ticketmaster_id) where ticketmaster_id is not null;
