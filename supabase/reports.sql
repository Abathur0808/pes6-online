-- ============================================================
-- PES 6 Online — Sistema de reportes de avatar (incremental)
-- Aplicar en: Supabase Dashboard → SQL Editor
--
-- A los 3 reportes distintos la foto se elimina y el usuario
-- queda baneado de volver a subir avatar (avatar_banned = true).
-- La cuenta sigue activa: el baneo solo afecta a la foto.
-- ============================================================

alter table public.profiles
  add column if not exists avatar_banned boolean not null default false;

create table if not exists public.avatar_reports (
  reported_id uuid not null references public.profiles (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reported_id, reporter_id),
  check (reported_id <> reporter_id)
);

alter table public.avatar_reports enable row level security;

-- Cada usuario solo puede reportar en su nombre y ver sus propios reportes.
-- El conteo y el baneo los hace el backend con service role (bypass RLS).
create policy "avatar_reports_insert_own" on public.avatar_reports
  for insert with check (auth.uid() = reporter_id);
create policy "avatar_reports_read_own" on public.avatar_reports
  for select using (auth.uid() = reporter_id);
