-- Tabla de auditoría inmutable para asistencias.
-- Captura una copia completa de cada fila antes de cualquier UPDATE o DELETE.
-- Permite recuperar datos si se borran por accidente (replanificación, etc).

CREATE TABLE IF NOT EXISTS public.asistencias_audit (
    id              bigserial       PRIMARY KEY,
    accion          text            NOT NULL CHECK (accion IN ('UPDATE', 'DELETE')),
    asistencia_id   bigint          NOT NULL,
    usuario_id      bigint,
    configuracion_dia_id bigint,
    estado_anterior text,
    estado_nuevo    text,
    datos_anteriores jsonb          NOT NULL,
    datos_nuevos     jsonb,
    modificado_por  uuid,
    ocurrido_en     timestamptz     NOT NULL DEFAULT now()
);

ALTER TABLE public.asistencias_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select_authenticated"
    ON public.asistencias_audit
    FOR SELECT
    TO authenticated
    USING (true);

CREATE INDEX IF NOT EXISTS idx_asistencias_audit_asistencia_id  ON public.asistencias_audit (asistencia_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_audit_config_id      ON public.asistencias_audit (configuracion_dia_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_audit_ocurrido_en    ON public.asistencias_audit (ocurrido_en DESC);

CREATE OR REPLACE FUNCTION public.audit_asistencias()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.asistencias_audit (
            accion, asistencia_id, usuario_id, configuracion_dia_id,
            estado_anterior, estado_nuevo, datos_anteriores, datos_nuevos,
            modificado_por
        ) VALUES (
            'DELETE', OLD.id, OLD.usuario_id, OLD.configuracion_dia_id,
            OLD.estado, NULL, to_jsonb(OLD), NULL,
            auth.uid()
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.estado IS DISTINCT FROM NEW.estado
            OR OLD.justificacion IS DISTINCT FROM NEW.justificacion
            OR OLD.tipo_justificacion IS DISTINCT FROM NEW.tipo_justificacion
            OR OLD.hora_registro IS DISTINCT FROM NEW.hora_registro
        THEN
            INSERT INTO public.asistencias_audit (
                accion, asistencia_id, usuario_id, configuracion_dia_id,
                estado_anterior, estado_nuevo, datos_anteriores, datos_nuevos,
                modificado_por
            ) VALUES (
                'UPDATE', OLD.id, OLD.usuario_id, OLD.configuracion_dia_id,
                OLD.estado, NEW.estado, to_jsonb(OLD), to_jsonb(NEW),
                auth.uid()
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_asistencias ON public.asistencias;

CREATE TRIGGER trg_audit_asistencias
AFTER UPDATE OR DELETE ON public.asistencias
FOR EACH ROW
EXECUTE FUNCTION public.audit_asistencias();
