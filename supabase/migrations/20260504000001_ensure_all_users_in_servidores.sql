-- ─────────────────────────────────────────────────────────────────────────────
-- Ensure all users belong to 'Servidores' department
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Function to automatically add new users to 'Servidores'
CREATE OR REPLACE FUNCTION public.handle_new_user_servidores()
RETURNS TRIGGER AS $$
DECLARE
  v_servidores_id bigint;
BEGIN
  -- Find the Servidores department ID
  SELECT id INTO v_servidores_id FROM public.departamentos WHERE nombre = 'Servidores' LIMIT 1;
  
  IF v_servidores_id IS NOT NULL THEN
    -- Only insert if not already present (to avoid unique constraint violations)
    INSERT INTO public.membresias (usuario_id, departamento_id, rol_jerarquico)
    VALUES (NEW.id, v_servidores_id, 'Servidor')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger to execute the function after a new user is inserted
DROP TRIGGER IF EXISTS on_user_created_add_servidores ON public.usuarios;
CREATE TRIGGER on_user_created_add_servidores
  AFTER INSERT ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_servidores();

-- 3. Data Migration: Add all existing users to 'Servidores' if they are not already members
INSERT INTO public.membresias (usuario_id, departamento_id, rol_jerarquico)
SELECT u.id, d.id, 'Servidor'
FROM public.usuarios u
CROSS JOIN (SELECT id FROM public.departamentos WHERE nombre = 'Servidores' LIMIT 1) d
WHERE d.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.membresias m 
    WHERE m.usuario_id = u.id AND m.departamento_id = d.id
  )
ON CONFLICT DO NOTHING;
