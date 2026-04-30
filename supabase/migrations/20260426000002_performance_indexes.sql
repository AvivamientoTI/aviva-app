-- ─────────────────────────────────────────────────────────────────────────────
-- PERFORMANCE: Indexes on high-frequency FK and filter columns
-- ─────────────────────────────────────────────────────────────────────────────

-- asistencias
CREATE INDEX IF NOT EXISTS idx_asistencias_usuario_id
  ON public.asistencias(usuario_id);

CREATE INDEX IF NOT EXISTS idx_asistencias_configuracion_dia_id
  ON public.asistencias(configuracion_dia_id);

CREATE INDEX IF NOT EXISTS idx_asistencias_usuario_config
  ON public.asistencias(usuario_id, configuracion_dia_id);

CREATE INDEX IF NOT EXISTS idx_asistencias_estado
  ON public.asistencias(estado);

-- asignaciones
CREATE INDEX IF NOT EXISTS idx_asignaciones_usuario_id
  ON public.asignaciones(usuario_id);

CREATE INDEX IF NOT EXISTS idx_asignaciones_configuracion_dia_id
  ON public.asignaciones(configuracion_dia_id);

CREATE INDEX IF NOT EXISTS idx_asignaciones_usuario_config
  ON public.asignaciones(usuario_id, configuracion_dia_id);

-- membresias
CREATE INDEX IF NOT EXISTS idx_membresias_usuario_id
  ON public.membresias(usuario_id);

CREATE INDEX IF NOT EXISTS idx_membresias_departamento_id
  ON public.membresias(departamento_id);

CREATE INDEX IF NOT EXISTS idx_membresias_usuario_dept
  ON public.membresias(usuario_id, departamento_id);

CREATE INDEX IF NOT EXISTS idx_membresias_rol_jerarquico
  ON public.membresias(departamento_id, lower(rol_jerarquico));

-- suspensiones
CREATE INDEX IF NOT EXISTS idx_suspensiones_usuario_id
  ON public.suspensiones(usuario_id);

CREATE INDEX IF NOT EXISTS idx_suspensiones_fechas
  ON public.suspensiones(fecha_inicio, fecha_fin);

-- configuracion_dia
CREATE INDEX IF NOT EXISTS idx_configuracion_dia_rol_cabecera_id
  ON public.configuracion_dia(rol_cabecera_id);

CREATE INDEX IF NOT EXISTS idx_configuracion_dia_fecha
  ON public.configuracion_dia(fecha);

-- roles_cabecera
CREATE INDEX IF NOT EXISTS idx_roles_cabecera_departamento_id
  ON public.roles_cabecera(departamento_id);

-- agenda_eventos
CREATE INDEX IF NOT EXISTS idx_agenda_eventos_fecha
  ON public.agenda_eventos(fecha);

-- agenda_eventos_vistos
CREATE INDEX IF NOT EXISTS idx_agenda_vistos_usuario_id
  ON public.agenda_eventos_vistos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_agenda_vistos_evento_id
  ON public.agenda_eventos_vistos(evento_id);
