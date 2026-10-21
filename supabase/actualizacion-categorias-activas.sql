-- ============================================================================
-- Catalogo Wha · Actualización: activar / desactivar categorías
-- ----------------------------------------------------------------------------
-- Añade la columna `active` a `categories`, igual que ya existe en `products`.
-- Con ella el panel muestra un interruptor por categoría y el catálogo público
-- oculta las categorías desactivadas (y los artículos que dependen de ellas).
--
-- Ejecuta este script UNA vez en Supabase → SQL Editor → New query → Run.
-- Es idempotente: se puede ejecutar varias veces sin errores.
-- ============================================================================

alter table public.categories
  add column if not exists active boolean not null default true;

-- Las categorías que ya existían quedan activas (el default las rellena).
-- Si alguna quedó con NULL por un cambio previo, se normaliza:
update public.categories set active = true where active is null;

-- Comprobación rápida (opcional): debe listar la columna `active`.
-- select column_name, data_type, column_default
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'categories'
--  order by ordinal_position;
