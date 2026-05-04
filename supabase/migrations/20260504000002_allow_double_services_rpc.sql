-- ─────────────────────────────────────────────────────────────────────────────
-- Update get_blocked_users to support service-level exclusion (service_index)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Limpieza agresiva de cualquier versión previa de la función para evitar conflictos de firma o retorno
DO $$ 
DECLARE 
    _r record;
BEGIN
    FOR _r IN (
        SELECT oid::regprocedure as sig 
        FROM pg_proc 
        WHERE proname = 'get_blocked_users' 
          AND pronamespace = 'public'::regnamespace
    ) 
    LOOP
        EXECUTE 'DROP FUNCTION ' || _r.sig;
    END LOOP;
END $$;

-- 2. Crear la nueva versión con soporte para service_index
CREATE OR REPLACE FUNCTION public.get_blocked_users(p_date date, p_service_index integer DEFAULT NULL)
RETURNS TABLE (usuario_id bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT ag.usuario_id
  FROM public.asignaciones ag
  JOIN public.configuracion_dia cd ON ag.configuracion_dia_id = cd.id
  WHERE cd.fecha = p_date
    AND (p_service_index IS NULL OR cd.service_index = p_service_index);
$$;
