-- ============================================================
-- PES 6 Online — Salas hasta 16 jugadores
-- (incremental sobre leagues.sql)
-- Aplicar en: Supabase Dashboard → SQL Editor
--
-- Lobbies grandes para organizar jornadas de liga: todos los
-- participantes entran a una sala para coordinar sus partidas.
-- ============================================================

alter table public.rooms
  drop constraint if exists rooms_max_players_check;

alter table public.rooms
  add constraint rooms_max_players_check
  check (max_players between 2 and 16);
