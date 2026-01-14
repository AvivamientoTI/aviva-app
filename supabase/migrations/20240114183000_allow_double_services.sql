-- Migration: Allow multiple services per day (Double Service)

-- 1. Drop the existing unique constraint if it exists (usually specific to roles_cabecera_id + fecha)
-- Note: The exact name might vary, so we try to drop based on columns or known name.
-- Assuming standard naming or we just add a new one and drop the old logic if enforced by index.

DO $$
BEGIN
    -- Try to drop constraint if it follows standard naming
    -- (You might need to verify the exact constraint name in your DB)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'configuracion_dia_roles_cabecera_id_fecha_key') THEN
        ALTER TABLE configuracion_dia DROP CONSTRAINT configuracion_dia_roles_cabecera_id_fecha_key;
    END IF;
END $$;

-- 2. Add new unique constraint including 'tipo_servicio'
-- This allows: Same Header, Same Date, BUT Different Service Type (e.g. 'Mañana' vs 'Tarde')
ALTER TABLE configuracion_dia
ADD CONSTRAINT configuracion_dia_composite_key UNIQUE (roles_cabecera_id, fecha, tipo_servicio);
