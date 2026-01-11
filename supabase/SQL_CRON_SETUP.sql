-- Enable the required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule the job to run every day at 8:00 AM (UTC)
-- REPLACE 'YOUR_PROJECT_REF' with your actual Supabase project reference ID
-- REPLACE 'YOUR_SERVICE_ROLE_KEY' with your actual service role key (found in Project Settings > API)

select cron.schedule(
  'check-birthdays-daily', -- Nombre del trabajo
  '0 6 * * *',            -- Programar para las 06:00 UTC (00:00 Hora Costa Rica UTC-6)
  $$
  select
    net.http_post(
        -- REEMPLAZAR CON LA URL DE SU FUNCION DESPLEGADA
        url:='https://ndgyicayxjgygijvahbu.supabase.co/functions/v1/check-birthdays', 
        
        -- REEMPLAZAR 'YOUR_SERVICE_ROLE_KEY' CON SU LLAVE REAL (Settings > API > service_role)
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- To check if it's running:
-- select * from cron.job;
-- select * from net.http_request_queue;
