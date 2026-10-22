-- ============================================================
-- PES 6 Online — Desafíos directos entre jugadores
-- (incremental sobre rooms-16.sql)
-- Aplicar en: Supabase Dashboard → SQL Editor
--
-- Un jugador desafía a otro; si acepta, el servidor crea la sala
-- 1v1 y mete a ambos. Solo un desafío pendiente por pareja.
-- ============================================================

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.profiles (id) on delete cascade,
  challenged_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  room_id uuid references public.rooms (id) on delete set null,
  created_at timestamptz not null default now(),
  check (challenger_id <> challenged_id)
);

create unique index if not exists challenges_pending_pair
  on public.challenges (least(challenger_id, challenged_id), greatest(challenger_id, challenged_id))
  where status = 'pending';

alter table public.challenges enable row level security;

create policy "challenges_read" on public.challenges
  for select using (auth.uid() in (challenger_id, challenged_id));
create policy "challenges_insert" on public.challenges
  for insert with check (auth.uid() = challenger_id);
create policy "challenges_update" on public.challenges
  for update using (auth.uid() in (challenger_id, challenged_id));
