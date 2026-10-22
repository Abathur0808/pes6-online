-- ============================================================
-- PES 6 Online — Torneos eliminatorios (bracket)
-- (incremental sobre matchmaking.sql)
-- Aplicar en: Supabase Dashboard → SQL Editor
--
-- Eliminatoria simple con byes: el organizador genera el bracket
-- completo; los ganadores avanzan solos al confirmar el marcador.
-- Reutiliza los enums league_status y league_match_status.
-- ============================================================

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status league_status not null default 'draft',
  created_by uuid not null references public.profiles (id),
  winner_id uuid references public.profiles (id),
  rounds integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tournament_members (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (tournament_id, user_id)
);

create table if not exists public.tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  round integer not null,           -- 1 = primera ronda
  slot integer not null,            -- posición dentro de la ronda
  home_user_id uuid references public.profiles (id),
  away_user_id uuid references public.profiles (id),
  home_score integer check (home_score >= 0),
  away_score integer check (away_score >= 0),
  winner_id uuid references public.profiles (id),
  status league_match_status not null default 'scheduled',
  reported_by uuid references public.profiles (id),
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tournament_id, round, slot)
);

create index if not exists tournament_matches_t
  on public.tournament_matches (tournament_id, round, slot);

alter table public.tournaments enable row level security;
alter table public.tournament_members enable row level security;
alter table public.tournament_matches enable row level security;

drop policy if exists "tournaments_read" on public.tournaments;
create policy "tournaments_read" on public.tournaments for select using (true);
drop policy if exists "tournaments_insert" on public.tournaments;
create policy "tournaments_insert" on public.tournaments
  for insert with check (auth.uid() = created_by);
drop policy if exists "tournaments_update_owner" on public.tournaments;
create policy "tournaments_update_owner" on public.tournaments
  for update using (auth.uid() = created_by);

drop policy if exists "tmembers_read" on public.tournament_members;
create policy "tmembers_read" on public.tournament_members for select using (true);
drop policy if exists "tmembers_insert" on public.tournament_members;
create policy "tmembers_insert" on public.tournament_members
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.tournaments t
      where t.id = tournament_members.tournament_id and t.status = 'draft'
    )
  );
drop policy if exists "tmembers_delete" on public.tournament_members;
create policy "tmembers_delete" on public.tournament_members
  for delete using (
    auth.uid() = user_id
    and exists (
      select 1 from public.tournaments t
      where t.id = tournament_members.tournament_id and t.status = 'draft'
    )
  );

drop policy if exists "tmatches_read" on public.tournament_matches;
create policy "tmatches_read" on public.tournament_matches for select using (true);
drop policy if exists "tmatches_insert_owner" on public.tournament_matches;
create policy "tmatches_insert_owner" on public.tournament_matches
  for insert with check (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_matches.tournament_id and t.created_by = auth.uid()
    )
  );
drop policy if exists "tmatches_update" on public.tournament_matches;
create policy "tmatches_update" on public.tournament_matches
  for update using (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_matches.tournament_id and t.created_by = auth.uid()
    )
    or auth.uid() in (home_user_id, away_user_id)
  );
