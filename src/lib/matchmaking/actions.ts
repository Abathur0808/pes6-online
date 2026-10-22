"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SERVER } from "@/lib/servers";
import type { RoomStatus } from "@/types/database";

export interface QueueResult {
  error?: string;
  /** Sala creada tras emparejar — navegar aquí directo. */
  roomId?: string;
  /** Posición aproximada en la cola (para mostrar). */
  waiting?: number;
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Entrar a la cola. Si hay otro esperando, empareja al instante:
 * crea la sala 1v1 (host = quien esperaba) y mete a ambos.
 */
export async function joinQueue(): Promise<QueueResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  // ¿Ya me emparejaron mientras tanto?
  const { data: mine } = await supabase
    .from("matchmaking_queue")
    .select("room_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (mine?.room_id) {
    await supabase
      .from("matchmaking_queue")
      .delete()
      .eq("user_id", user.id);
    return { roomId: mine.room_id };
  }

  // ¿Alguien esperando? (FIFO por joined_at)
  const admin = createAdminClient();
  const { data: others } = await admin
    .from("matchmaking_queue")
    .select("user_id")
    .is("room_id", null)
    .neq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1);

  if (others && others.length > 0) {
    const rival = others[0].user_id;
    const { data: room, error: roomErr } = await admin
      .from("rooms")
      .insert({
        name: "Matchmaking 1v1",
        code: generateCode(),
        host_id: rival, // el que esperaba organiza
        status: "full" satisfies RoomStatus,
        max_players: 2,
        match_settings: {
          match_length: 10,
          mode: "1v1",
          server: DEFAULT_SERVER,
        },
      })
      .select("id")
      .single();

    if (roomErr || !room)
      return { error: roomErr?.message ?? "No se pudo crear la sala." };

    await admin.from("room_members").insert([
      { room_id: room.id, user_id: rival, role: "host" },
      { room_id: room.id, user_id: user.id, role: "guest" },
    ]);
    await admin
      .from("matchmaking_queue")
      .update({ room_id: room.id })
      .in("user_id", [rival, user.id]);

    // Yo ya tengo la sala: mi fila puede salir de la cola.
    await supabase.from("matchmaking_queue").delete().eq("user_id", user.id);
    return { roomId: room.id };
  }

  // Nadie esperando: me pongo en cola (upsert = idempotente).
  const { error } = await supabase.from("matchmaking_queue").upsert({
    user_id: user.id,
    joined_at: new Date().toISOString(),
    room_id: null,
  });
  if (error) return { error: error.message };
  return { waiting: 1 };
}

/** Sondeo desde el cliente: ¿ya me emparejaron? */
export async function checkQueue(): Promise<QueueResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data: mine } = await supabase
    .from("matchmaking_queue")
    .select("room_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (mine?.room_id) {
    await supabase
      .from("matchmaking_queue")
      .delete()
      .eq("user_id", user.id);
    return { roomId: mine.room_id };
  }
  if (!mine) return { waiting: 0 }; // no estoy en cola
  return { waiting: 1 };
}

/** Salir de la cola. */
export async function leaveQueue(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("matchmaking_queue").delete().eq("user_id", user.id);
}
