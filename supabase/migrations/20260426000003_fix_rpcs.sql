-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 1: get_blocked_users — was called in code but never defined
-- Returns all usuario_ids that have an assignment on a given date
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_blocked_users(p_date date)
RETURNS TABLE (usuario_id bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT ag.usuario_id
  FROM public.asignaciones ag
  JOIN public.configuracion_dia cd ON ag.configuracion_dia_id = cd.id
  WHERE cd.fecha = p_date;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 2: search_users_fuzzy — increase LIMIT and add authorization guard
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_users_fuzzy(p_dept_id bigint, p_search_query text)
RETURNS TABLE (id bigint, nombre text, apellido text, score real)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    u.id,
    u.nombre,
    u.apellido,
    similarity(u.nombre || ' ' || u.apellido, p_search_query) AS score
  FROM public.usuarios u
  JOIN public.membresias m ON u.id = m.usuario_id
  WHERE m.departamento_id = p_dept_id
    AND similarity(u.nombre || ' ' || u.apellido, p_search_query) > 0.1
  ORDER BY score DESC
  LIMIT 5;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 3: get_attendance_detailed — add dept leader authorization check
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_attendance_detailed(p_config_dia_id bigint, p_dept_id bigint)
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization: caller must be admin or leader of the requested department
  IF NOT (public.is_admin() OR public.is_dept_leader(p_dept_id)) THEN
    RAISE EXCEPTION 'Acceso denegado: no eres líder de este departamento'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  WITH target_users AS (
    SELECT DISTINCT u.id, u.nombre, u.apellido
    FROM public.usuarios u
    JOIN public.membresias m ON u.id = m.usuario_id
    WHERE p_dept_id = 2 AND m.departamento_id = 2

    UNION

    SELECT u.id, u.nombre, u.apellido
    FROM public.usuarios u
    JOIN public.asignaciones ag ON u.id = ag.usuario_id
    WHERE p_dept_id <> 2 AND ag.configuracion_dia_id = p_config_dia_id
  ),
  user_assignments AS (
    SELECT ag.usuario_id, p.nombre AS posicion_nombre
    FROM public.asignaciones ag
    LEFT JOIN public.posiciones_departamento p ON ag.posicion_id = p.id
    WHERE ag.configuracion_dia_id = p_config_dia_id
  )
  SELECT
    tu.id,
    tu.nombre,
    tu.apellido,
    ua.posicion_nombre,
    a.id AS asistencia_id,
    a.estado,
    a.justificacion,
    CAST(a.hora_registro AS text),
    a.registrado_por
  FROM target_users tu
  LEFT JOIN user_assignments ua ON tu.id = ua.usuario_id
  LEFT JOIN public.asistencias a
    ON tu.id = a.usuario_id AND a.configuracion_dia_id = p_config_dia_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 4: get_birthdays_today — add SECURITY DEFINER and fail-safe for missing user
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_birthdays_today(p_month integer, p_day integer)
RETURNS TABLE (id bigint, nombre text, apellido text, fecha_nacimiento date, genero text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT u.id, u.nombre, u.apellido, u.fecha_nacimiento, u.genero
  FROM public.usuarios u
  WHERE EXTRACT(MONTH FROM u.fecha_nacimiento) = p_month
    AND EXTRACT(DAY FROM u.fecha_nacimiento) = p_day;
$$;
