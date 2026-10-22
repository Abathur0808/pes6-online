-- ============================================================
-- PES 6 Online — Cola de matchmaking "buscar rival"
-- (incremental sobre challenges.sql)
-- Aplicar en: Supabase Dashboard → SQL Editor
--
-- El usuario entra a la cola; el primer servidor que encuentra a
-- otro esperando crea la sala y fija room_id en ambas filas (vía
-- service role). Cada fila solo la ve y la borra su dueño.
-- ============================================================

create table if not exists public.matchmaking_queue (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  room_id uuid references public.rooms (id) on delete set null
);

alter table public.matchmaking_queue enable row level security;

create policy "queue_read_own" on public.matchmaking_queue
  for select using (auth.uid() = user_id);
create policy "queue_insert_own" on public.matchmaking_queue
  for insert with check (auth.uid() = user_id);
create policy "queue_delete_own" on public.matchmaking_queue
  for delete using (auth.uid() = user_id);
