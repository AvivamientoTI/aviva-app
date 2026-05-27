-- ─────────────────────────────────────────────────────────────────────────────
-- FIX: Encargado/Encargada no podía guardar asistencia por falta de permisos
-- en la política RLS de asistencias. Se crea is_dept_encargado() y se
-- actualiza la política de escritura para incluirla.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Helper: check if current user is Encargado/Encargada of a given dept ────
CREATE OR REPLACE FUNCTION public.is_dept_encargado(p_dept_id bigint)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.membresias m
    JOIN public.user_profiles up ON up.usuario_id = m.usuario_id
    WHERE up.id = (SELECT auth.uid())
      AND m.departamento_id = p_dept_id
      AND m.rol_jerarquico IN ('Encargado', 'Encargada')
  );
$$;

-- ── Drop the existing write policy on asistencias ───────────────────────────
DROP POLICY IF EXISTS "Gestión de asistencias por admins y lideres" ON public.asistencias;

-- ── Recreate with Encargado support ─────────────────────────────────────────
CREATE POLICY "Gestión de asistencias por admins, lideres y encargados"
  ON public.asistencias FOR ALL
  TO authenticated
  USING (
    is_global_admin()
    OR EXISTS (
      SELECT 1 FROM public.membresias m
      WHERE m.usuario_id = asistencias.usuario_id
        AND (
          public.is_dept_leader(m.departamento_id)
          OR public.is_dept_encargado(m.departamento_id)
        )
    )
  )
  WITH CHECK (
    is_global_admin()
    OR EXISTS (
      SELECT 1 FROM public.membresias m
      WHERE m.usuario_id = asistencias.usuario_id
        AND (
          public.is_dept_leader(m.departamento_id)
          OR public.is_dept_encargado(m.departamento_id)
        )
    )
  );
