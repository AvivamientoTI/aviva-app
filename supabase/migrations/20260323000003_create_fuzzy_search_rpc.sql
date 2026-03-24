CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION search_users_fuzzy(p_dept_id bigint, p_search_query text)
RETURNS TABLE (id bigint, nombre text, apellido text, score real)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        u.id, 
        u.nombre, 
        u.apellido,
        similarity(u.nombre || ' ' || u.apellido, p_search_query) as score
    FROM usuarios u
    JOIN membresias m ON u.id = m.usuario_id
    WHERE m.departamento_id = p_dept_id
      AND similarity(u.nombre || ' ' || u.apellido, p_search_query) > 0.1
    ORDER BY score DESC
    LIMIT 1;
$$;
