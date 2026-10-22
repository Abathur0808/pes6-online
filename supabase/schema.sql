-- ============================================================
-- PES 6 Online — Esquema inicial de base de datos (PostgreSQL/Supabase)
-- Aplicar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  avatar_url text,
  matches_played integer not null default 0 check (matches_played >= 0),
  wins integer not null default 0 check (wins >= 0),
  draws integer not null default 0 check (draws >= 0),
  losses integer not null default 0 check (losses >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Crear perfil automáticamente al registrarse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'player_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- rooms ----------
create type room_status as enum
  ('waiting', 'full', 'connecting', 'in_game', 'finished');
create type room_role as enum ('host', 'guest');

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code char(6) not null unique,
  name text not null check (char_length(name) between 1 and 60),
  status room_status not null default 'waiting',
  host_id uuid not null references public.profiles (id) on delete cascade,
  match_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role room_role not null,
  ready boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

-- Máximo 2 miembros por sala (1v1).
create or replace function public.enforce_room_capacity()
returns trigger
language plpgsql
as $$
declare member_count integer;
begin
  select count(*) into member_count
  from public.room_members where room_id = new.room_id;
  if member_count >= 2 then
    raise exception 'room_full';
  end if;
  return new;
end;
$$;

drop trigger if exists room_capacity on public.room_members;
create trigger room_capacity
  before insert on public.room_members
  for each row execute function public.enforce_room_capacity();

-- ---------- teams ----------
create type team_kind as enum ('club', 'national', 'classic');

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind team_kind not null,
  era text,
  crest_url text,
  -- true mientras no dispongamos de recursos autorizados
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- matches ----------
create type match_status as enum
  ('scheduled', 'in_progress', 'finished', 'cancelled');

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms (id) on delete set null,
  home_user_id uuid not null references public.profiles (id),
  away_user_id uuid not null references public.profiles (id),
  status match_status not null default 'scheduled',
  played_at timestamptz,
  created_at timestamptz not null default now(),
  check (home_user_id <> away_user_id)
);

create table if not exists public.match_results (
  match_id uuid primary key references public.matches (id) on delete cascade,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  reported_by uuid not null references public.profiles (id),
  -- Solo el servidor (service role / game backend) puede marcar verified=true.
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- tournaments ----------
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  format text not null default 'single_elimination',
  status text not null default 'draft',
  starts_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.tournament_participants (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  seed integer,
  joined_at timestamptz not null default now(),
  primary key (tournament_id, user_id)
);

-- ---------- updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_rooms on public.rooms;
create trigger touch_rooms before update on public.rooms
  for each row execute function public.touch_updated_at();
drop trigger if exists touch_profiles on public.profiles;
create trigger touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.match_results enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_participants enable row level security;

-- profiles: lectura pública; cada usuario solo edita su perfil
-- (estadísticas NUNCA editables por el cliente → sin policy de update
-- sobre wins/losses: se gestiona con service role en el backend).
create policy "profiles_read" on public.profiles
  for select using (true);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- rooms: lectura pública de salas abiertas; solo el host crea/actualiza.
create policy "rooms_read" on public.rooms
  for select using (true);
create policy "rooms_insert_auth" on public.rooms
  for insert with check (auth.uid() = host_id);
create policy "rooms_update_host" on public.rooms
  for update using (auth.uid() = host_id);

-- room_members: lectura para miembros y lectores de la sala;
-- un usuario solo puede unirse/salirse a sí mismo.
create policy "room_members_read" on public.room_members
  for select using (true);
create policy "room_members_join_self" on public.room_members
  for insert with check (auth.uid() = user_id);
create policy "room_members_leave_self" on public.room_members
  for delete using (auth.uid() = user_id);
create policy "room_members_update_self" on public.room_members
  for update using (auth.uid() = user_id);

-- teams: lectura pública; escritura solo service role (sin policy = denegado).
create policy "teams_read" on public.teams
  for select using (true);

-- matches/results: lectura pública; escritura solo backend (service role),
-- para que el cliente no pueda falsificar resultados.
create policy "matches_read" on public.matches
  for select using (true);
create policy "match_results_read" on public.match_results
  for select using (true);
create policy "match_results_report" on public.match_results
  for insert with check (auth.uid() = reported_by and verified = false);

-- tournaments: lectura pública; participación propia.
create policy "tournaments_read" on public.tournaments
  for select using (true);
create policy "tournaments_create" on public.tournaments
  for insert with check (auth.uid() = created_by);
create policy "tournament_participants_read" on public.tournament_participants
  for select using (true);
create policy "tournament_participants_join" on public.tournament_participants
  for insert with check (auth.uid() = user_id);
create policy "tournament_participants_leave" on public.tournament_participants
  for delete using (auth.uid() = user_id);

-- ---------- room_messages (chat de sala) ----------
create table if not exists public.room_messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists room_messages_room_created
  on public.room_messages (room_id, created_at);

alter table public.room_messages enable row level security;

create policy "room_messages_read" on public.room_messages
  for select using (true);
create policy "room_messages_insert_member" on public.room_messages
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.room_members rm
      where rm.room_id = room_messages.room_id
        and rm.user_id = auth.uid()
    )
  );

-- ---------- avatar_reports (moderación comunitaria) ----------
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
create policy "avatar_reports_insert_own" on public.avatar_reports
  for insert with check (auth.uid() = reporter_id);
create policy "avatar_reports_read_own" on public.avatar_reports
  for select using (auth.uid() = reporter_id);

-- ---------- friendships + commends ----------
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
create policy "friendships_read_own" on public.friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friendships_insert" on public.friendships
  for insert with check (auth.uid() = requester_id);
create policy "friendships_update_addressee" on public.friendships
  for update using (auth.uid() = addressee_id);
create policy "friendships_delete_own" on public.friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

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
    and exists (
      select 1 from public.room_members rm
      where rm.room_id = commends.room_id and rm.user_id = commends.from_id
    )
    and exists (
      select 1 from public.room_members rm
      where rm.room_id = commends.room_id and rm.user_id = commends.to_id
    )
  );

-- ---------- Salas multi-jugador + Ligas ----------
alter table public.rooms
  add column if not exists max_players integer not null default 2
    check (max_players between 2 and 8);

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

alter table public.league_matches
  add column if not exists scheduled_at timestamptz;

create index if not exists league_matches_league
  on public.league_matches (league_id, matchday);

alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.league_matches enable row level security;

create policy "leagues_read" on public.leagues for select using (true);
create policy "leagues_insert" on public.leagues
  for insert with check (auth.uid() = created_by);
create policy "leagues_update_owner" on public.leagues
  for update using (auth.uid() = created_by);
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
create policy "league_matches_read" on public.league_matches
  for select using (true);
create policy "league_matches_owner" on public.league_matches
  for all using (
    exists (
      select 1 from public.leagues l
      where l.id = league_matches.league_id and l.created_by = auth.uid()
    )
  );
create policy "league_matches_participants" on public.league_matches
  for update using (
    auth.uid() in (home_user_id, away_user_id)
    and status in ('scheduled', 'pending_confirm')
  ) with check (
    auth.uid() in (home_user_id, away_user_id)
  );

-- Realtime para salas (Supabase Realtime → enable en Dashboard o):
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.room_messages;
