-- Fix audit log type mismatch: asistencias.id is uuid.
ALTER TABLE public.asistencias_audit
  ALTER COLUMN asistencia_id TYPE uuid USING asistencia_id::text::uuid;
