-- ============================================================================
-- Catalogo Wha · Actualización: campos de «Información del negocio»
-- ----------------------------------------------------------------------------
-- La sección Ajustes → Información del negocio permite editar región, ciudad
-- y dirección, pero la tabla `businesses` no tenía esas columnas. Cualquier
-- guardado era rechazado por Postgres (42703) y por eso no se podía guardar.
--
-- Ejecuta este script UNA vez en Supabase → SQL Editor → New query → Run.
-- Es idempotente: se puede ejecutar varias veces sin errores.
-- ============================================================================

alter table public.businesses add column if not exists region  text;
alter table public.businesses add column if not exists city    text;
alter table public.businesses add column if not exists address text;

-- `timezone` ya existe en el esquema; no hace falta crearla.

-- Comprobación rápida (opcional): debe listar region, city y address.
-- select column_name, data_type
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'businesses'
--  order by ordinal_position;
