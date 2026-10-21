-- ============================================================================
-- Catalogo Wha · Porfolio (trabajos de ejemplo)
-- ----------------------------------------------------------------------------
-- Crea la tabla `portfolio` y sus políticas, siguiendo el mismo esquema que
-- `categories` y `products`:
--   · Lectura pública (el porfolio es una página abierta del negocio).
--   · Escritura solo para quien puede gestionar el negocio: dueño, colaborador
--     con rol de gestor o super administrador (función can_manage_business).
--
-- Ejecuta este script UNA vez en Supabase → SQL Editor → New query → Run.
-- Es idempotente: se puede ejecutar varias veces sin errores.
-- ============================================================================

create table if not exists public.portfolio (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title       text not null,
  description text,
  image_url   text,
  sort_order  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists portfolio_business_idx on public.portfolio (business_id, sort_order);
create index if not exists portfolio_active_idx   on public.portfolio (business_id) where active;

alter table public.portfolio enable row level security;

-- Lectura pública: cualquiera puede ver los trabajos de un negocio publicado.
drop policy if exists "portfolio_public_read" on public.portfolio;
create policy "portfolio_public_read" on public.portfolio
  for select using (true);

-- Escritura: dueño del negocio, colaborador gestor o super administrador.
drop policy if exists "portfolio_insert" on public.portfolio;
create policy "portfolio_insert" on public.portfolio
  for insert to authenticated
  with check (public.can_manage_business(business_id));

drop policy if exists "portfolio_update" on public.portfolio;
create policy "portfolio_update" on public.portfolio
  for update to authenticated
  using (public.can_manage_business(business_id))
  with check (public.can_manage_business(business_id));

drop policy if exists "portfolio_delete" on public.portfolio;
create policy "portfolio_delete" on public.portfolio
  for delete to authenticated
  using (public.can_manage_business(business_id));

-- Permisos de tabla
grant select on public.portfolio to anon, authenticated;
grant insert, update, delete on public.portfolio to authenticated;

-- Comprobación rápida (opcional):
-- select count(*) from public.portfolio;
