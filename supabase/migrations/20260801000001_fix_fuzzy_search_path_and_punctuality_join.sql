-- Fixes two pre-existing bugs that made RPCs error at runtime.
--
-- Both were present in the original project and were carried over faithfully by the
-- database migration; neither is a migration regression. Verified by running each
-- RPC against both projects and getting byte-identical errors.

-- ---------------------------------------------------------------------------
-- 1. search_users_fuzzy: "function similarity(text, text) does not exist"
--
-- The function is SECURITY DEFINER with `SET search_path TO 'public'`, which is the
-- right security posture — it stops a caller from hijacking name resolution. But
-- similarity() comes from pg_trgm, which Supabase installs into the `extensions`
-- schema, so the pinned path could never resolve it and every call failed.
--
-- Fix: keep the path explicit (do NOT drop the SET, that would reopen the hijack
-- risk) and add `extensions` to it.
-- ---------------------------------------------------------------------------
ALTER FUNCTION public.search_users_fuzzy(bigint, text)
  SET search_path = public, extensions;


-- ---------------------------------------------------------------------------
-- 2. get_punctuality_stats: "column rc.configuracion_dia_id does not exist"
--
-- The CTE joined `roles_cabecera rc ON rc.configuracion_dia_id = cd.id`, but
-- roles_cabecera has no such column. The foreign keys show the relationship runs
-- the other way:
--     configuracion_dia.rol_cabecera_id -> roles_cabecera.id
--
-- Fix: invert the join condition. Everything else is unchanged from the original.
--
-- Note: the 'America/Guatemala' timezone below is left as-is. It is UTC-6 with no
-- DST, identical to America/Costa_Rica, so it has no effect on the result.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_punctuality_stats(p_dept_id integer, p_limit integer DEFAULT 100)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result JSONB;
BEGIN
    WITH punctuality_data AS (
        SELECT
            CASE
                WHEN EXTRACT(HOUR FROM hora_registro) < 8 OR (EXTRACT(HOUR FROM hora_registro) = 8 AND EXTRACT(MINUTE FROM hora_registro) < 50) THEN 'Temprano'
                WHEN EXTRACT(HOUR FROM (hora_registro AT TIME ZONE 'UTC' AT TIME ZONE 'America/Guatemala')) = 8 OR (EXTRACT(HOUR FROM (hora_registro AT TIME ZONE 'UTC' AT TIME ZONE 'America/Guatemala')) = 9 AND EXTRACT(MINUTE FROM (hora_registro AT TIME ZONE 'UTC' AT TIME ZONE 'America/Guatemala')) <= 5) THEN 'A tiempo'
                ELSE 'Tarde'
            END as label
        FROM public.asistencias a
        INNER JOIN public.configuracion_dia cd ON cd.id = a.configuracion_dia_id
        INNER JOIN public.roles_cabecera rc ON rc.id = cd.rol_cabecera_id
        WHERE rc.departamento_id = p_dept_id
          AND a.estado = 'Asistió'
          AND a.hora_registro IS NOT NULL
        ORDER BY a.hora_registro DESC
        LIMIT p_limit
    )
    SELECT jsonb_agg(jsonb_build_object('label', label, 'count', count))
    INTO result
    FROM (
        SELECT r.label, COUNT(pd.label) as count
        FROM (
            SELECT 'Temprano' as label UNION ALL SELECT 'A tiempo' UNION ALL SELECT 'Tarde'
        ) r
        LEFT JOIN punctuality_data pd ON pd.label = r.label
        GROUP BY r.label
    ) sub;

    RETURN result;
END;
$function$;
