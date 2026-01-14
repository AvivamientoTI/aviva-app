-- Fix is_servidores_leader function
-- The previous version used 'auth_user_id' which doesn't exist on user_profiles (it uses 'id' as the PK which matches auth.users.id)
-- And it selected 'id' from user_profiles, but we need the 'usuario_id' integer to match with 'membresias.usuario_id'

create or replace function public.is_servidores_leader()
returns boolean as $$
begin
  return exists (
    select 1 from public.membresias m
    join public.departamentos d on m.departamento_id = d.id
    where m.usuario_id = (
      -- Get the public.usuarios integer ID that corresponds to the currently authenticated user
      select usuario_id from public.user_profiles where id = auth.uid()
    )
    and d.nombre = 'Servidores'
    and lower(m.rol_jerarquico) in ('líder', 'lider', 'sublíder', 'sublider')
  );
end;
$$ language plpgsql security definer;
