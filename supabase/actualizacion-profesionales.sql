-- WA Professionnels Maroc · Profesionales / empleados por negocio
-- Ejecuta en Supabase → SQL Editor → Run (idempotente).

create table if not exists public.professionals (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  name         text not null,
  role         text,
  active       boolean not null default true,
  work_days    jsonb not null default '[1,2,3,4,5,6]'::jsonb,
  open_time    text not null default '09:00',
  close_time   text not null default '18:00',
  slot_minutes integer not null default 30,
  created_at   timestamptz not null default now()
);
create index if not exists professionals_business_idx on public.professionals (business_id);

alter table public.orders add column if not exists professional_id uuid references public.professionals(id) on delete set null;
alter table public.orders add column if not exists professional_name text;

alter table public.professionals enable row level security;
drop policy if exists "professionals_public_read" on public.professionals;
create policy "professionals_public_read" on public.professionals for select using (true);
drop policy if exists "professionals_insert" on public.professionals;
create policy "professionals_insert" on public.professionals for insert to authenticated
  with check (public.can_manage_business(business_id));
drop policy if exists "professionals_update" on public.professionals;
create policy "professionals_update" on public.professionals for update to authenticated
  using (public.can_manage_business(business_id)) with check (public.can_manage_business(business_id));
drop policy if exists "professionals_delete" on public.professionals;
create policy "professionals_delete" on public.professionals for delete to authenticated
  using (public.can_manage_business(business_id));

grant select on public.professionals to anon, authenticated;
grant insert, update, delete on public.professionals to authenticated;

-- Disponibilidad por profesional
drop function if exists public.busy_slots(uuid, date);
create or replace function public.busy_slots(bid uuid, day date, pro uuid default null)
returns setof text
language sql security definer set search_path = public stable
as $$
  select to_char(o.appointment_at, 'HH24:MI')
  from public.orders o
  where o.business_id = bid
    and o.appointment_at is not null
    and (o.appointment_at at time zone 'UTC')::date = day
    and coalesce(o.status, 'new') <> 'cancelled'
    and ((pro is null and o.professional_id is null) or o.professional_id = pro);
$$;

alter table public.orders add column if not exists customer_email text;
