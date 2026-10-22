-- ============================================================
-- PES 6 Online — Chat de sala (incremental sobre schema.sql)
-- Aplicar en: Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.room_messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 300),
  created_at timestamptz not null default now()
);

-- Indice para cargar el historial de una sala rapidamente.
create index if not exists room_messages_room_created
  on public.room_messages (room_id, created_at);

alter table public.room_messages enable row level security;

-- Lectura publica (las salas son publicas); escribir solo siendo miembro.
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

-- Realtime para que el chat se actualice sin recargar.
alter publication supabase_realtime add table public.room_messages;
