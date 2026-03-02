-- Add Humanitix sync columns to events table
alter table events add column humanitix_id text unique;
alter table events add column humanitix_url text;

create index events_humanitix_id_idx on events(humanitix_id) where humanitix_id is not null;
