-- ============================================================================
-- WA Professionnels Maroc · Disponibilidad de citas
-- ----------------------------------------------------------------------------
-- Función que devuelve solo las HORAS ya ocupadas de un día, para que el
-- catálogo público pueda pintar el calendario sin permiso de lectura sobre
-- `orders` (que solo tiene el negocio).
--
-- Ejecuta este script UNA vez en Supabase → SQL Editor → New query → Run.
-- ============================================================================

create or replace function public.busy_slots(bid uuid, day date)
returns setof text
language sql
security definer
set search_path = public
stable
as $$
  select to_char(o.appointment_at, 'HH24:MI')
  from public.orders o
  where o.business_id = bid
    and o.appointment_at is not null
    and (o.appointment_at at time zone 'UTC')::date = day
    and coalesce(o.status, 'new') <> 'cancelled';
$$;

-- Comprobación rápida (opcional):
-- select * from public.busy_slots('00000000-0000-0000-0000-000000000000', current_date);
