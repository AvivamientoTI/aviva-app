-- Función SQL para obtener los cumpleañeros del día
CREATE OR REPLACE FUNCTION get_birthdays_today(p_month integer, p_day integer)
RETURNS TABLE (
    id bigint,
    nombre text,
    apellido text,
    fecha_nacimiento date,
    genero text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id, nombre, apellido, fecha_nacimiento, genero
    FROM usuarios
    WHERE EXTRACT(MONTH FROM fecha_nacimiento) = p_month
      AND EXTRACT(DAY FROM fecha_nacimiento) = p_day;
$$;
