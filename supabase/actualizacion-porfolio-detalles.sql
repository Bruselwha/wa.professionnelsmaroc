-- ============================================================================
-- WA Professionnels Maroc · Porfolio: detalles del trabajo
-- ----------------------------------------------------------------------------
-- Añade a cada trabajo los campos que se muestran en el pop-up del porfolio:
-- detalles (una línea por punto), cliente, lugar y fecha.
--
-- Ejecuta este script UNA vez en Supabase → SQL Editor → New query → Run.
-- Es idempotente.
-- ============================================================================

alter table public.portfolio add column if not exists details   text;
alter table public.portfolio add column if not exists client    text;
alter table public.portfolio add column if not exists place     text;
alter table public.portfolio add column if not exists work_date text;

-- Comprobación rápida (opcional):
-- select column_name from information_schema.columns
--  where table_schema='public' and table_name='portfolio' order by ordinal_position;

alter table public.portfolio add column if not exists category text;
alter table public.portfolio add column if not exists price numeric(12,2);
alter table public.portfolio add column if not exists link text;
