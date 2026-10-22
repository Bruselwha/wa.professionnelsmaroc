-- ============================================================================
-- WA Professionnels Maroc · Contenido multiidioma
-- ----------------------------------------------------------------------------
-- Añade una columna `i18n` (jsonb) a los contenidos del usuario para guardar
-- sus traducciones al francés y al árabe. El idioma base sigue en las columnas
-- normales (name, description, title…), así que si una traducción falta se
-- muestra el texto base.
--
-- Formato:  { "fr": { "name": "...", "description": "..." }, "ar": { ... } }
--
-- Ejecuta este script UNA vez en Supabase → SQL Editor → New query → Run.
-- Es idempotente.
-- ============================================================================

alter table public.businesses add column if not exists i18n jsonb not null default '{}'::jsonb;
alter table public.categories add column if not exists i18n jsonb not null default '{}'::jsonb;
alter table public.products   add column if not exists i18n jsonb not null default '{}'::jsonb;
alter table public.portfolio  add column if not exists i18n jsonb not null default '{}'::jsonb;

-- Comprobación rápida (opcional):
-- select table_name, column_name from information_schema.columns
--  where table_schema='public' and column_name='i18n' order by table_name;
