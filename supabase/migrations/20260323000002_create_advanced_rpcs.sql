CREATE OR REPLACE FUNCTION get_attendance_detailed(p_config_dia_id bigint, p_dept_id bigint)
RETURNS TABLE (
    usuario_id bigint,
    nombre text,
    apellido text,
    posicion_nombre text,
    asistencia_id uuid,
    estado text,
    justificacion text,
    hora_registro text,
    registrado_por bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
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
        a.justificacion,
        CAST(a.hora_registro AS text) as hora_registro,
        a.registrado_por
    FROM target_users tu
    LEFT JOIN user_assignments ua ON tu.id = ua.usuario_id
    LEFT JOIN asistencias a ON tu.id = a.usuario_id AND a.configuracion_dia_id = p_config_dia_id;
$$;

CREATE OR REPLACE FUNCTION get_weekly_attendance_trend(p_dept_id integer, p_weeks integer)
RETURNS TABLE (
    week_start_date date,
    present bigint,
    absent bigint,
    total bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        date_trunc('week', c.fecha)::date as week_start_date,
        sum(case when a.estado = 'Asistió' then 1 else 0 end) as present,
        sum(case when a.estado != 'Asistió' then 1 else 0 end) as absent,
        count(*) as total
    FROM asistencias a 
    JOIN configuracion_dia c ON a.configuracion_dia_id = c.id
    JOIN roles_cabecera r ON c.rol_cabecera_id = r.id
    WHERE r.departamento_id = p_dept_id
      AND c.fecha >= (CURRENT_DATE - (p_weeks * 7))
    GROUP BY date_trunc('week', c.fecha)::date
    ORDER BY week_start_date ASC;
$$;

CREATE OR REPLACE FUNCTION get_churn_risk(p_dept_id integer, p_weeks integer)
RETURNS TABLE (
    id bigint,
    nombre text,
    apellido text,
    asistencias bigint,
    faltas bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        u.id, u.nombre, u.apellido,
        count(case when a.estado = 'Asistió' then 1 end) as asistencias,
        count(case when a.estado != 'Asistió' then 1 end) as faltas
    FROM asistencias a 
    JOIN usuarios u ON a.usuario_id = u.id
    JOIN configuracion_dia c ON a.configuracion_dia_id = c.id
    JOIN roles_cabecera r ON c.rol_cabecera_id = r.id
    WHERE r.departamento_id = p_dept_id
      AND c.fecha >= (CURRENT_DATE - (p_weeks * 7))
    GROUP BY u.id, u.nombre, u.apellido
    HAVING count(case when a.estado != 'Asistió' then 1 end) > 0;
$$;
