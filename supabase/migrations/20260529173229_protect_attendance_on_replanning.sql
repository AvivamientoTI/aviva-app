-- Prevent monthly replanning from deleting attendance history.
-- configuracion_dia is the parent record for asistencias; deleting it used to
-- cascade into asistencias. This trigger blocks that destructive path once a
-- service has attendance rows.

CREATE OR REPLACE FUNCTION public.prevent_config_delete_with_attendance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_attendance_count integer;
BEGIN
  SELECT count(*)
    INTO v_attendance_count
  FROM public.asistencias
  WHERE configuracion_dia_id = OLD.id;

  IF v_attendance_count > 0 THEN
    RAISE EXCEPTION
      'No se puede eliminar el servicio % porque tiene % registro(s) de asistencia.',
      OLD.id,
      v_attendance_count
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_config_delete_with_attendance
  ON public.configuracion_dia;

CREATE TRIGGER trg_prevent_config_delete_with_attendance
BEFORE DELETE ON public.configuracion_dia
FOR EACH ROW
EXECUTE FUNCTION public.prevent_config_delete_with_attendance();
