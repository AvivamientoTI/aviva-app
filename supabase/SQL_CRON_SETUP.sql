-- Enable the required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule the job to run every day at 8:00 AM (UTC)
-- REPLACE 'YOUR_PROJECT_REF' with your actual Supabase project reference ID
-- REPLACE 'YOUR_SERVICE_ROLE_KEY' with your actual service role key (found in Project Settings > API)

select cron.schedule(
  'check-birthdays-daily', -- name of the cron job
  '0 12 * * *',           -- 08:00 AM America/Asuncion (UTC-4 approx) or 12:00 UTC. Adjust as needed.
  $$
  select
    net.http_post(
        url:='https://ndgyicayxjgygijvahbu.supabase.co/functions/v1/check-birthdays',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- To check if it's running:
-- select * from cron.job;
-- select * from net.http_request_queue;
