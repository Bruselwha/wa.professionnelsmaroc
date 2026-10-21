-- ============================================================================
-- WA Professionnels Maroc · Esquema completo para un proyecto NUEVO de Supabase
-- ----------------------------------------------------------------------------
-- Ejecuta este archivo completo en Supabase → SQL Editor → New query → Run.
-- Es idempotente: se puede ejecutar varias veces sin errores.
--
-- Incluye: tablas, funciones, triggers, RLS, políticas, bucket de Storage y
-- permisos. Ya incorpora las columnas de las últimas entregas:
--   · businesses.region / city / address
--   · categories.active
--   · products.short_desc
--   · tabla portfolio (nueva)
-- ============================================================================

-- pgcrypto ya está activo en Supabase. Se intenta igualmente por si acaso;
-- si el servidor no lo tiene, gen_random_uuid() es nativo desde PostgreSQL 13.
do $$
begin
  create extension if not exists pgcrypto;
exception when others then
  raise notice 'pgcrypto no disponible; se usa gen_random_uuid() nativo';
end $$;

-- ============================================================================
-- 1. TABLAS
-- ============================================================================

create table if not exists public.businesses (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  owner_email     text,
  name            text not null,
  slug            text not null unique,
  description     text not null default '',
  whatsapp        text not null default '',
  country         text not null default 'MA',
  currency        text not null default 'MAD',
  timezone        text not null default 'Africa/Casablanca',
  region          text,
  city            text,
  address         text,
  brand_color     text not null default '#5B1A80',
  logo_url        text not null default '',
  hero_enabled    boolean not null default false,
  hero_title      text not null default '',
  hero_desc       text not null default '',
  hero_image      text not null default '',
  delivery        text not null default 'whatsapp',
  delivery_fee    numeric(12,2) not null default 0,
  delivery_time   text not null default '',
  delivery_notes  text not null default '',
  payments        jsonb not null default '[]'::jsonb,
  payment_notes   text not null default '',
  seo_title       text not null default '',
  seo_description text not null default '',
  seo_keywords    text not null default '',
  seo_image       text not null default '',
  published       boolean not null default false,
  plan            text not null default 'free',
  max_products    integer not null default 15,
  max_storage_mb  integer not null default 100,
  open_time       text not null default '09:00',
  close_time      text not null default '18:00',
  slot_minutes    integer not null default 30,
  work_days       jsonb not null default '[1,2,3,4,5,6]'::jsonb,
  onboarded       boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists businesses_owner_idx on public.businesses (owner_id);

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null,
  slug        text not null default '',
  sort_order  integer not null default 0,
  image_url   text,
  alt         text,
  kind        text not null default 'product',   -- 'product' | 'service'
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists categories_business_idx on public.categories (business_id, sort_order);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name        text not null,
  slug        text not null default '',
  short_desc  text,
  description text not null default '',
  price       numeric(12,2) not null default 0,
  promo_price numeric(12,2),
  sort_order  integer not null default 0,
  active      boolean not null default true,
  images      jsonb not null default '[]'::jsonb,
  views       integer not null default 0,
  kind        text not null default 'product',   -- 'product' | 'service'
  duration    text,
  modality    text,
  bookable    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists products_business_idx on public.products (business_id, sort_order);
create index if not exists products_category_idx on public.products (category_id);

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.businesses(id) on delete cascade,
  code             text,
  customer_name    text not null default '',
  customer_phone   text not null default '',
  customer_address text not null default '',
  customer_city    text not null default '',
  note             text not null default '',
  items            jsonb not null default '[]'::jsonb,
  subtotal         numeric(12,2) not null default 0,
  fee              numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  appointment_at   timestamptz,
  status           text not null default 'new',
  created_at       timestamptz not null default now()
);
create index if not exists orders_business_idx on public.orders (business_id, created_at desc);

create table if not exists public.library (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  url         text not null,
  name        text,
  size_bytes  bigint not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists library_business_idx on public.library (business_id);

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

create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.admins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid unique references auth.users(id) on delete cascade,
  email      text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.business_members (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  email       text not null,
  role        text not null default 'support',   -- 'support' | 'manager' | 'owner'
  note        text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists members_business_idx on public.business_members (business_id);
create index if not exists members_email_idx on public.business_members (lower(email));

create table if not exists public.admin_audit (
  id          uuid primary key default gen_random_uuid(),
  admin_email text,
  action      text not null,
  target      text,
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_created_idx on public.admin_audit (created_at desc);

-- ============================================================================
-- 2. FUNCIONES
-- ============================================================================

-- ¿Es super administrador? SECURITY DEFINER para poder leer `admins` sin
-- entrar en recursión con su propia política RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (
    select 1 from public.admins a
    where a.user_id = auth.uid()
       or (auth.uid() is not null and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  );
$$;

create or replace function public.owns_business(bid uuid)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (select 1 from public.businesses b where b.id = bid and b.owner_id = auth.uid());
$$;

-- Lectura: admin, dueño o miembro (cualquier rol).
create or replace function public.can_access_business(bid uuid)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select public.is_admin()
      or public.owns_business(bid)
      or exists (
           select 1 from public.business_members m
           where m.business_id = bid
             and (m.user_id = auth.uid()
                  or lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
         );
$$;

-- Escritura: admin, dueño o miembro con rol owner/manager.
create or replace function public.can_manage_business(bid uuid)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select public.is_admin()
      or public.owns_business(bid)
      or exists (
           select 1 from public.business_members m
           where m.business_id = bid
             and m.role in ('owner', 'manager')
             and (m.user_id = auth.uid()
                  or lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
         );
$$;

-- Contador de visitas de un artículo (lo llama el catálogo público).
create or replace function public.increment_product_views(pid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products set views = coalesce(views, 0) + 1 where id = pid;
$$;

-- Añadir/quitar super administradores desde el panel.
--   · Si todavía no hay ningún admin, cualquiera puede crear el primero.
--   · A partir de ahí, solo un admin puede añadir a otros.
create or replace function public.make_admin(admin_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_id uuid;
begin
  if exists (select 1 from public.admins) and not public.is_admin() then
    raise exception 'Solo un administrador puede añadir administradores';
  end if;

  select u.id into target_id from auth.users u where lower(u.email) = lower(admin_email) limit 1;

  insert into public.admins (user_id, email)
  values (target_id, lower(admin_email))
  on conflict (email) do update
    set user_id = coalesce(public.admins.user_id, excluded.user_id);
end;
$$;

-- ============================================================================
-- 3. TRIGGERS SOBRE auth.users
-- ============================================================================

-- Al registrarse: crea el negocio (usando el nombre y el slug del formulario)
-- y la categoría por defecto «Otros».
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  biz_name text;
  biz_slug text;
  bid uuid;
begin
  biz_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'business_name'), ''),
                       split_part(coalesce(new.email, 'negocio'), '@', 1));
  biz_slug := nullif(trim(new.raw_user_meta_data ->> 'slug'), '');
  if biz_slug is null or biz_slug = '' then
    biz_slug := regexp_replace(lower(biz_name), '[^a-z0-9]+', '-', 'g');
    biz_slug := trim(both '-' from biz_slug);
  end if;
  if biz_slug = '' then biz_slug := 'negocio'; end if;

  -- Slug único
  if exists (select 1 from public.businesses where slug = biz_slug) then
    biz_slug := biz_slug || '-' || substr(new.id::text, 1, 6);
  end if;

  insert into public.businesses (owner_id, owner_email, name, slug)
  values (new.id, new.email, biz_name, biz_slug)
  returning id into bid;

  insert into public.categories (business_id, name, slug, sort_order, kind)
  values (bid, 'Otros', 'otros', 0, 'product');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Al registrarse: enlaza las invitaciones de cobertura y los admins que se
-- añadieron por correo antes de que la cuenta existiera.
create or replace function public.link_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.business_members
     set user_id = new.id
   where user_id is null
     and lower(email) = lower(coalesce(new.email, ''));

  update public.admins
     set user_id = new.id
   where user_id is null
     and lower(email) = lower(coalesce(new.email, ''));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_link_member on auth.users;
create trigger on_auth_user_created_link_member
  after insert on auth.users
  for each row execute function public.link_member();

-- ============================================================================
-- 4. RLS Y POLÍTICAS
-- ============================================================================

alter table public.businesses       enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.orders           enable row level security;
alter table public.library          enable row level security;
alter table public.portfolio        enable row level security;
alter table public.site_settings    enable row level security;
alter table public.admins           enable row level security;
alter table public.business_members enable row level security;
alter table public.admin_audit      enable row level security;

-- ---- businesses ----
drop policy if exists "businesses_public_read" on public.businesses;
create policy "businesses_public_read" on public.businesses
  for select using (true);

drop policy if exists "businesses_insert_own" on public.businesses;
create policy "businesses_insert_own" on public.businesses
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "businesses_update_manage" on public.businesses;
create policy "businesses_update_manage" on public.businesses
  for update to authenticated
  using (public.can_manage_business(id))
  with check (public.can_manage_business(id));

drop policy if exists "businesses_delete_owner" on public.businesses;
create policy "businesses_delete_owner" on public.businesses
  for delete to authenticated
  using (public.owns_business(id) or public.is_admin());

-- ---- categories / products / library / portfolio ----
do $$
declare
  t text;
begin
  foreach t in array array['categories', 'products', 'library', 'portfolio'] loop
    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format('create policy %I on public.%I for select using (true)', t || '_public_read', t);

    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.can_manage_business(business_id))', t || '_insert', t);

    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.can_manage_business(business_id)) with check (public.can_manage_business(business_id))', t || '_update', t);

    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.can_manage_business(business_id))', t || '_delete', t);
  end loop;
end;
$$;

-- ---- orders ----
-- Cualquiera (sin sesión) puede crear un pedido; solo el negocio los lee.
drop policy if exists "orders_insert_public" on public.orders;
create policy "orders_insert_public" on public.orders
  for insert with check (true);

drop policy if exists "orders_read_manage" on public.orders;
create policy "orders_read_manage" on public.orders
  for select to authenticated using (public.can_access_business(business_id));

drop policy if exists "orders_update_manage" on public.orders;
create policy "orders_update_manage" on public.orders
  for update to authenticated
  using (public.can_manage_business(business_id))
  with check (public.can_manage_business(business_id));

drop policy if exists "orders_delete_manage" on public.orders;
create policy "orders_delete_manage" on public.orders
  for delete to authenticated using (public.can_manage_business(business_id));

-- ---- site_settings ----
drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read" on public.site_settings
  for select using (true);

drop policy if exists "settings_admin_write" on public.site_settings;
create policy "settings_admin_write" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- admins ----
drop policy if exists "admins_read" on public.admins;
create policy "admins_read" on public.admins
  for select to authenticated
  using (public.is_admin()
         or user_id = auth.uid()
         or lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "admins_admin_write" on public.admins;
create policy "admins_admin_write" on public.admins
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- business_members ----
drop policy if exists "members_read" on public.business_members;
create policy "members_read" on public.business_members
  for select to authenticated using (public.can_access_business(business_id));

drop policy if exists "members_manage" on public.business_members;
create policy "members_manage" on public.business_members
  for all to authenticated
  using (public.can_manage_business(business_id))
  with check (public.can_manage_business(business_id));

-- ---- admin_audit ----
drop policy if exists "audit_admin_read" on public.admin_audit;
create policy "audit_admin_read" on public.admin_audit
  for select to authenticated using (public.is_admin());

drop policy if exists "audit_admin_insert" on public.admin_audit;
create policy "audit_admin_insert" on public.admin_audit
  for insert to authenticated with check (public.is_admin());

-- ============================================================================
-- 5. PERMISOS DE TABLA
-- ============================================================================

grant usage on schema public to anon, authenticated;

grant select on public.businesses, public.categories, public.products,
                public.library, public.portfolio, public.site_settings
  to anon, authenticated;

grant select on public.orders to authenticated;
grant insert on public.orders to anon, authenticated;

grant select on public.admins, public.business_members, public.admin_audit to authenticated;

grant insert, update, delete on public.businesses, public.categories, public.products,
                                 public.library, public.portfolio, public.site_settings,
                                 public.admins, public.business_members, public.admin_audit
  to authenticated;

-- ============================================================================
-- 6. STORAGE (bucket público de imágenes)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('catalog-images', 'catalog-images', true)
on conflict (id) do nothing;

drop policy if exists "catalog_images_read" on storage.objects;
create policy "catalog_images_read" on storage.objects
  for select using (bucket_id = 'catalog-images');

drop policy if exists "catalog_images_insert" on storage.objects;
create policy "catalog_images_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'catalog-images');

drop policy if exists "catalog_images_update" on storage.objects;
create policy "catalog_images_update" on storage.objects
  for update to authenticated using (bucket_id = 'catalog-images');

drop policy if exists "catalog_images_delete" on storage.objects;
create policy "catalog_images_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'catalog-images');

-- ============================================================================
-- 7. PRIMER SUPER ADMINISTRADOR
-- ----------------------------------------------------------------------------
-- 1. Registra tu cuenta desde /login (o créala en Authentication → Users).
-- 2. Ejecuta esto cambiando el correo:
--
--    insert into public.admins (user_id, email)
--    select id, email from auth.users where email = 'tu@correo.com'
--    on conflict (email) do update set user_id = excluded.user_id;
--
-- 3. Vuelve a entrar al panel: aparecerá 🛡️ Administración.
-- ============================================================================
