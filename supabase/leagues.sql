-- ============================================================
-- PES 6 Online — Salas multi-jugador + Ligas (incremental)
-- Aplicar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ---------- Salas con más de 2 jugadores (lobby) ----------
alter table public.rooms
  add column if not exists max_players integer not null default 2
    check (max_players between 2 and 16);

create or replace function public.enforce_room_capacity()
returns trigger
language plpgsql
as $$
declare member_count integer; cap integer;
begin
  select count(*) into member_count
  from public.room_members where room_id = new.room_id;
  select max_players into cap
  from public.rooms where id = new.room_id;
  if member_count >= cap then
    raise exception 'room_full';
  end if;
  return new;
end;
$$;

-- ---------- Ligas ----------
create type league_status as enum ('draft', 'active', 'finished');
create type league_match_status as enum
  ('scheduled', 'pending_confirm', 'played', 'cancelled');

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 60),
  description text,
  status league_status not null default 'draft',
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create table if not exists public.league_matches (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  matchday integer not null,
  home_user_id uuid not null references public.profiles (id),
  away_user_id uuid not null references public.profiles (id),
  home_score integer check (home_score >= 0),
  away_score integer check (away_score >= 0),
  status league_match_status not null default 'scheduled',
  reported_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  check (home_user_id <> away_user_id)
);

create index if not exists league_matches_league
  on public.league_matches (league_id, matchday);

-- ---------- RLS ----------
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.league_matches enable row level security;

-- Ligas: lectura pública (el registro es visible para todos);
-- solo el creador edita.
create policy "leagues_read" on public.leagues
  for select using (true);
create policy "leagues_insert" on public.leagues
  for insert with check (auth.uid() = created_by);
create policy "leagues_update_owner" on public.leagues
  for update using (auth.uid() = created_by);

-- Miembros: lectura pública; unirse solo mientras la liga está en
-- borrador (abierta a inscripciones); salirse es libre.
create policy "league_members_read" on public.league_members
  for select using (true);
create policy "league_members_join" on public.league_members
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.leagues l
      where l.id = league_members.league_id and l.status = 'draft'
    )
  );
create policy "league_members_leave" on public.league_members
  for delete using (auth.uid() = user_id);

-- Partidos de liga: lectura pública (fixture + resultados visibles).
create policy "league_matches_read" on public.league_matches
  for select using (true);
-- El organizador gestiona el fixture (generar/borrar/editar).
create policy "league_matches_owner" on public.league_matches
  for all using (
    exists (
      select 1 from public.leagues l
      where l.id = league_matches.league_id and l.created_by = auth.uid()
    )
  );
-- Los participantes reportan/confirman su partido mientras no esté
-- cerrado (played/cancelled).
create policy "league_matches_participants" on public.league_matches
  for update using (
    auth.uid() in (home_user_id, away_user_id)
    and status in ('scheduled', 'pending_confirm')
  ) with check (
    auth.uid() in (home_user_id, away_user_id)
  );
