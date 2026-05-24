DO $$
DECLARE
  constraint_record record;
BEGIN
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.asistencias'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%tipo_justificacion%'
  LOOP
    EXECUTE format('ALTER TABLE public.asistencias DROP CONSTRAINT %I', constraint_record.conname);
  END LOOP;

  ALTER TABLE public.asistencias
    ADD CONSTRAINT asistencias_tipo_justificacion_check
    CHECK (
      tipo_justificacion IS NULL
      OR tipo_justificacion IN ('trabajo', 'salud', 'estudio', 'permiso_pastoral', 'distancia', 'otro')
    );
END $$;
