-- ============================================================
-- PES 6 Online — Divisiones de liga con ascenso/descenso
-- (incremental sobre proofs.sql)
-- Aplicar en: Supabase Dashboard → SQL Editor
--
-- Una liga puede tener una división inferior enlazada
-- (parent_league_id). Cuando la principal se llena, los nuevos
-- se inscriben a la de ascenso. Al terminar, el organizador
-- aplica el intercambio: relegation_size equipos suben y bajan.
-- relegation_size = 0 → sin ascensos · máximo 4 plazas.
-- ============================================================

alter table public.leagues
  add column if not exists max_members integer not null default 16
    check (max_members between 2 and 64);

alter table public.leagues
  add column if not exists division integer not null default 1;

alter table public.leagues
  add column if not exists parent_league_id uuid
    references public.leagues (id) on delete set null;

alter table public.leagues
  add column if not exists relegation_size integer not null default 0
    check (relegation_size >= 0 and relegation_size <= 4);

alter table public.leagues
  add column if not exists swapped boolean not null default false;
