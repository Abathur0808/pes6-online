-- ============================================================
-- PES 6 Online — Amistades + elogios (incremental)
-- Aplicar en: Supabase Dashboard → SQL Editor
--
-- Amigos: solicitudes pendientes/aceptadas entre perfiles.
-- Elogios: reputación positiva y VERIFICABLE — solo se puede
-- elogiar a quien compartió sala contigo, una vez por etiqueta
-- y partido. Sin votos negativos: nadie puede hundir a otro.
-- ============================================================

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

alter table public.friendships enable row level security;

-- Solo las dos partes ven la relación; el solicitante crea,
-- el destinatario acepta/rechaza, cualquiera de los dos borra.
create policy "friendships_read_own" on public.friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friendships_insert" on public.friendships
  for insert with check (auth.uid() = requester_id);
create policy "friendships_update_addressee" on public.friendships
  for update using (auth.uid() = addressee_id);
create policy "friendships_delete_own" on public.friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ---------- commends (elogios) ----------
create table if not exists public.commends (
  room_id uuid not null references public.rooms (id) on delete cascade,
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  tag text not null check (tag in ('fair_play', 'good_game', 'punctual')),
  created_at timestamptz not null default now(),
  primary key (room_id, from_id, to_id, tag),
  check (from_id <> to_id)
);

alter table public.commends enable row level security;

create policy "commends_read" on public.commends
  for select using (true);
create policy "commends_insert_verified" on public.commends
  for insert with check (
    auth.uid() = from_id
    -- Ambos deben haber sido miembros de esa sala (elogio verificable).
    and exists (
      select 1 from public.room_members rm
      where rm.room_id = commends.room_id and rm.user_id = commends.from_id
    )
    and exists (
      select 1 from public.room_members rm
      where rm.room_id = commends.room_id and rm.user_id = commends.to_id
    )
  );
