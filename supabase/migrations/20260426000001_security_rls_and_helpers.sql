-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY: Helper functions + RLS policies on all critical tables
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Helper: check if current user is system admin ────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.usuarios u ON up.usuario_id = u.id
    WHERE up.id = auth.uid()
      AND lower(u.rol) IN ('admin', 'superadmin', 'administrador', 'super admin')
  );
$$;

-- ── Helper: check if current user is leader/sublider of a given department ───
CREATE OR REPLACE FUNCTION public.is_dept_leader(p_dept_id bigint)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.membresias m
    JOIN public.user_profiles up ON m.usuario_id = up.usuario_id
    WHERE up.id = auth.uid()
      AND m.departamento_id = p_dept_id
      AND lower(m.rol_jerarquico) IN ('líder', 'lider', 'sublíder', 'sublider')
  );
$$;

-- ── Helper: get the integer usuario_id for the current auth user ──────────────
CREATE OR REPLACE FUNCTION public.current_usuario_id()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT usuario_id FROM public.user_profiles WHERE id = auth.uid();
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: USUARIOS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer (necesario para listas de servidores)
CREATE POLICY "usuarios_select_authenticated"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (true);

-- Solo admins o el propio usuario pueden actualizar
CREATE POLICY "usuarios_update_own_or_admin"
  ON public.usuarios FOR UPDATE
  TO authenticated
  USING (
    id = public.current_usuario_id()
    OR public.is_admin()
  )
  WITH CHECK (
    id = public.current_usuario_id()
    OR public.is_admin()
  );

-- Solo admins pueden insertar/eliminar usuarios
CREATE POLICY "usuarios_insert_admin"
  ON public.usuarios FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "usuarios_delete_admin"
  ON public.usuarios FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: MEMBRESIAS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.membresias ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier autenticado (necesario para navegación y validaciones)
CREATE POLICY "membresias_select_authenticated"
  ON public.membresias FOR SELECT
  TO authenticated
  USING (true);

-- Escritura: solo líder del depto o admin
CREATE POLICY "membresias_write_leader_or_admin"
  ON public.membresias FOR ALL
  TO authenticated
  USING (
    public.is_dept_leader(departamento_id)
    OR public.is_admin()
  )
  WITH CHECK (
    public.is_dept_leader(departamento_id)
    OR public.is_admin()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: ASIGNACIONES
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.asignaciones ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier autenticado puede ver asignaciones (calendario público)
CREATE POLICY "asignaciones_select_authenticated"
  ON public.asignaciones FOR SELECT
  TO authenticated
  USING (true);

-- Escritura: solo líder del depto correspondiente o admin
CREATE POLICY "asignaciones_write_leader_or_admin"
  ON public.asignaciones FOR ALL
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.configuracion_dia cd
      JOIN public.roles_cabecera rc ON cd.rol_cabecera_id = rc.id
      WHERE cd.id = asignaciones.configuracion_dia_id
        AND public.is_dept_leader(rc.departamento_id)
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.configuracion_dia cd
      JOIN public.roles_cabecera rc ON cd.rol_cabecera_id = rc.id
      WHERE cd.id = asignaciones.configuracion_dia_id
        AND public.is_dept_leader(rc.departamento_id)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: ASISTENCIAS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

-- Lectura: el propio usuario puede ver la suya; líderes y admins ven todas
CREATE POLICY "asistencias_select"
  ON public.asistencias FOR SELECT
  TO authenticated
  USING (
    usuario_id = public.current_usuario_id()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.configuracion_dia cd
      JOIN public.roles_cabecera rc ON cd.rol_cabecera_id = rc.id
      WHERE cd.id = asistencias.configuracion_dia_id
        AND public.is_dept_leader(rc.departamento_id)
    )
  );

-- Escritura: líderes del depto o admins
CREATE POLICY "asistencias_write_leader_or_admin"
  ON public.asistencias FOR ALL
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.configuracion_dia cd
      JOIN public.roles_cabecera rc ON cd.rol_cabecera_id = rc.id
      WHERE cd.id = asistencias.configuracion_dia_id
        AND public.is_dept_leader(rc.departamento_id)
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.configuracion_dia cd
      JOIN public.roles_cabecera rc ON cd.rol_cabecera_id = rc.id
      WHERE cd.id = asistencias.configuracion_dia_id
        AND public.is_dept_leader(rc.departamento_id)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: CONFIGURACION_DIA
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.configuracion_dia ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier autenticado
CREATE POLICY "configuracion_dia_select_authenticated"
  ON public.configuracion_dia FOR SELECT
  TO authenticated
  USING (true);

-- Escritura: líder del depto o admin
CREATE POLICY "configuracion_dia_write_leader_or_admin"
  ON public.configuracion_dia FOR ALL
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.roles_cabecera rc
      WHERE rc.id = configuracion_dia.rol_cabecera_id
        AND public.is_dept_leader(rc.departamento_id)
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.roles_cabecera rc
      WHERE rc.id = configuracion_dia.rol_cabecera_id
        AND public.is_dept_leader(rc.departamento_id)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: ROLES_CABECERA
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.roles_cabecera ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_cabecera_select_authenticated"
  ON public.roles_cabecera FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "roles_cabecera_write_leader_or_admin"
  ON public.roles_cabecera FOR ALL
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_dept_leader(departamento_id)
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_dept_leader(departamento_id)
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: SUSPENSIONES — reemplazar política permisiva
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can read suspensions" ON public.suspensiones;

-- Lectura: el propio usuario ve la suya; líderes de ese depto y admins ven todas
CREATE POLICY "suspensiones_select_restricted"
  ON public.suspensiones FOR SELECT
  TO authenticated
  USING (
    usuario_id = public.current_usuario_id()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.membresias m_target
      WHERE m_target.usuario_id = suspensiones.usuario_id
        AND public.is_dept_leader(m_target.departamento_id)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: AGENDA_EVENTOS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.agenda_eventos ENABLE ROW LEVEL SECURITY;

-- Lectura: todos los autenticados (agenda es pública para la congregación)
CREATE POLICY "agenda_eventos_select_authenticated"
  ON public.agenda_eventos FOR SELECT
  TO authenticated
  USING (true);

-- Escritura: solo admins
CREATE POLICY "agenda_eventos_write_admin"
  ON public.agenda_eventos FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: AGENDA_EVENTOS_VISTOS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.agenda_eventos_vistos ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo ve y gestiona sus propios registros de eventos vistos
CREATE POLICY "agenda_vistos_select_own"
  ON public.agenda_eventos_vistos FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid()::text OR usuario_id = public.current_usuario_id()::text);

CREATE POLICY "agenda_vistos_insert_own"
  ON public.agenda_eventos_vistos FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid()::text OR usuario_id = public.current_usuario_id()::text);

CREATE POLICY "agenda_vistos_delete_own"
  ON public.agenda_eventos_vistos FOR DELETE
  TO authenticated
  USING (usuario_id = auth.uid()::text OR usuario_id = public.current_usuario_id()::text);
