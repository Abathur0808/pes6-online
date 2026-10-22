-- ============================================================
-- PES 6 Online — Bucket de avatares (incremental sobre schema.sql)
-- Aplicar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Bucket público para lectura (las fotos se muestran en la web).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Cada usuario solo puede subir/actualizar/borrar su propio archivo:
-- la ruta obligada es "<user_id>/avatar".
create policy "avatars_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
