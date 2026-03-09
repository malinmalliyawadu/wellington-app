-- Schedule sync-everybody-eats-events to run every 30 minutes via pg_cron + pg_net
-- Requires the pg_cron and pg_net extensions to be enabled in Supabase dashboard

select cron.schedule(
  'sync-everybody-eats-events',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-everybody-eats-events',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
