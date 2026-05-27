-- ─────────────────────────────────────────────────────────────────────────────
-- FIX: Include tipo_justificacion in get_attendance_detailed RPC
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.get_attendance_detailed(bigint, bigint);

CREATE OR REPLACE FUNCTION public.get_attendance_detailed(p_config_dia_id bigint, p_dept_id bigint)
 RETURNS TABLE(
    usuario_id bigint, 
    nombre text, 
    apellido text, 
    posicion_nombre text, 
    asistencia_id uuid, 
    estado text, 
    tipo_justificacion text, 
    justificacion text, 
    hora_registro text, 
    registrado_por bigint
)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    -- If deptId = 2 (Servidores), bring all members of dept 2
    -- Otherwise, bring only those assigned to this configDiaId
    WITH target_users AS (
        SELECT DISTINCT u.id, u.nombre, u.apellido
        FROM usuarios u
        JOIN membresias m ON u.id = m.usuario_id
        WHERE p_dept_id = 2 AND m.departamento_id = 2
        
        UNION
        
        SELECT u.id, u.nombre, u.apellido
        FROM usuarios u
        JOIN asignaciones ag ON u.id = ag.usuario_id
        WHERE p_dept_id <> 2 AND ag.configuracion_dia_id = p_config_dia_id
    ),
    
    user_assignments AS (
        SELECT ag.usuario_id, p.nombre as posicion_nombre
        FROM asignaciones ag
        LEFT JOIN posiciones_departamento p ON ag.posicion_id = p.id
        WHERE ag.configuracion_dia_id = p_config_dia_id
    )
    
    SELECT 
        tu.id as usuario_id,
        tu.nombre,
        tu.apellido,
        ua.posicion_nombre,
        a.id as asistencia_id,
        a.estado,
        a.tipo_justificacion,
        a.justificacion,
        CAST(a.hora_registro AS text) as hora_registro,
        a.registrado_por
    FROM target_users tu
    LEFT JOIN user_assignments ua ON tu.id = ua.usuario_id
    LEFT JOIN asistencias a ON tu.id = a.usuario_id AND a.configuracion_dia_id = p_config_dia_id;
$function$;
