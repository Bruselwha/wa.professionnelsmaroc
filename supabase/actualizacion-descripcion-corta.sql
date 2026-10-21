-- ============================================================================
-- Catalogo Wha · Actualización: descripción corta de los artículos
-- ----------------------------------------------------------------------------
-- Añade `short_desc` a `products`. Es el texto breve que se muestra en las
-- tarjetas del catálogo público. Si se deja vacío, el catálogo recorta la
-- descripción larga a 90 caracteres automáticamente.
--
-- Ejecuta este script UNA vez en Supabase → SQL Editor → New query → Run.
-- Es idempotente.
-- ============================================================================

alter table public.products
  add column if not exists short_desc text;

-- Comprobación rápida (opcional):
-- select column_name, data_type
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'products'
--  order by ordinal_position;
