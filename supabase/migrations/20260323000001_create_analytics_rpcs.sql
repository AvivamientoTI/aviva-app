CREATE OR REPLACE FUNCTION get_global_attendance_health(p_start_date date)
RETURNS TABLE (
    departamento_id integer,
    total bigint,
    present bigint,
    active_servers bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        r.departamento_id,
        count(*) as total,
        sum(case when a.estado = 'Asistió' then 1 else 0 end) as present,
        count(distinct a.usuario_id) as active_servers
    FROM asistencias a 
    JOIN configuracion_dia c ON a.configuracion_dia_id = c.id
    JOIN roles_cabecera r ON c.rol_cabecera_id = r.id
    WHERE c.fecha >= p_start_date
    GROUP BY r.departamento_id;
$$;

CREATE OR REPLACE FUNCTION get_annual_attendance_heatmap(p_dept_id integer, p_start_date date)
RETURNS TABLE (
    fecha date,
    asistencias bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        c.fecha,
        count(*) as asistencias
    FROM asistencias a 
    JOIN configuracion_dia c ON a.configuracion_dia_id = c.id
    JOIN roles_cabecera r ON c.rol_cabecera_id = r.id
    WHERE r.departamento_id = p_dept_id
      AND c.fecha >= p_start_date
      AND a.estado = 'Asistió'
    GROUP BY c.fecha
    ORDER BY c.fecha;
$$;
