-- SCRIPT PARA EJECUCION INMEDIATA (PRUEBA)

-- 1. Reemplace 'YOUR_SERVICE_ROLE_KEY' con su clave real (Settings > API > service_role)
-- 2. Ejecute este script en el SQL Editor de Supabase.

select
    net.http_post(
        url:='https://ndgyicayxjgygijvahbu.supabase.co/functions/v1/check-birthdays', 
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;

-- Despues de ejecutar, revise:
-- 1. La respuesta en la pestaña "Results" (debería dar un ID)
-- 2. La tabla net.http_request_queue para ver el estado (opcional)
-- 3. Los logs de la Edge Function en el Dashboard para ver el resultado real.
