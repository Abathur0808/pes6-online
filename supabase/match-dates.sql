-- ============================================================
-- PES 6 Online — Fecha pactada + victoria por no presentarse
-- (incremental sobre leagues.sql)
-- Aplicar en: Supabase Dashboard → SQL Editor
--
-- scheduled_at: fecha/hora acordada para el partido (la fija el
-- organizador o los dos jugadores por acuerdo). Si alguien no se
-- presenta, el organizador otorga la victoria 3-0 por defecto (WO).
-- ============================================================

alter table public.league_matches
  add column if not exists scheduled_at timestamptz;
