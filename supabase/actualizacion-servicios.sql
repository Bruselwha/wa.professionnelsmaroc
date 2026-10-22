-- ============================================================================
-- WA Professionnels Maroc · Requisitos de los servicios
-- ----------------------------------------------------------------------------
-- Campo que se muestra al cliente en el formulario de reserva (qué necesita
-- el profesional, si hay desplazamiento, materiales, etc.).
--
-- Ejecuta este script UNA vez en Supabase → SQL Editor → New query → Run.
-- ============================================================================

alter table public.products add column if not exists requirements text;
