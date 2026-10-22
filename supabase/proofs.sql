-- ============================================================
-- PES 6 Online — Capturas de resultado (prueba del marcador)
-- (incremental sobre tournaments.sql)
-- Aplicar en: Supabase Dashboard → SQL Editor
--
-- Bucket público "proofs": cada usuario sube a su propia carpeta
-- "<user_id>/<archivo>". Las columnas proof_url guardan el enlace
-- en los partidos de liga y torneo.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict (id) do nothing;

drop policy if exists "proofs_read" on storage.objects;
create policy "proofs_read" on storage.objects
  for select using (bucket_id = 'proofs');

drop policy if exists "proofs_insert_own" on storage.objects;
create policy "proofs_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "proofs_delete_own" on storage.objects;
create policy "proofs_delete_own" on storage.objects
  for delete using (
    bucket_id = 'proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

alter table public.league_matches
  add column if not exists proof_url text;

alter table public.tournament_matches
  add column if not exists proof_url text;
