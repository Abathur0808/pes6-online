"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SERVER } from "@/lib/servers";
import type { RoomStatus } from "@/types/database";

export interface ChallengeResult {
  error?: string;
  ok?: boolean;
  roomId?: string;
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Envía un desafío a otro jugador. Solo uno pendiente por pareja. */
export async function sendChallenge(
  challengedId: string
): Promise<ChallengeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };
  if (user.id === challengedId)
    return { error: "No puedes desafiarte a ti mismo." };

  // Reutiliza un desafío suyo pendiente hacia mí: aceptarlo directo.
  const { data: incoming } = await supabase
    .from("challenges")
    .select("id")
    .eq("challenger_id", challengedId)
    .eq("challenged_id", user.id)
    .eq("status", "pending")
    .maybeSingle();
  if (incoming) return respondChallenge(incoming.id, true);

  const { error } = await supabase.from("challenges").insert({
    challenger_id: user.id,
    challenged_id: challengedId,
  });
  if (error?.code === "23505")
    return { error: "Ya hay un desafío pendiente entre ustedes." };
  if (error) return { error: error.message };

  revalidatePath("/amigos");
  return { ok: true };
}

/**
 * Responde un desafío. Al aceptar crea la sala 1v1 y mete a ambos
 * (el retado es host). Devuelve roomId para navegar a la sala.
 */
export async function respondChallenge(
  challengeId: string,
  accept: boolean
): Promise<ChallengeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data: ch } = await supabase
    .from("challenges")
    .select("id, challenger_id, challenged_id, status")
    .eq("id", challengeId)
    .single();
  if (!ch || ch.status !== "pending")
    return { error: "Este desafío ya no está disponible." };

  // El retado acepta/rechaza; el retador solo puede cancelar (accept=false).
  const isChallenged = ch.challenged_id === user.id;
  const isChallenger = ch.challenger_id === user.id;
  if (accept && !isChallenged)
    return { error: "Solo el retado puede aceptar." };
  if (!accept && !isChallenged && !isChallenger)
    return { error: "Sin permiso sobre este desafío." };

  if (!accept) {
    await supabase
      .from("challenges")
      .update({ status: isChallenger ? "cancelled" : "declined" })
      .eq("id", challengeId);
    revalidatePath("/amigos");
    return { ok: true };
  }

  // Aceptar: crear sala con el retado como host.
  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .insert({
      name: "Desafío 1v1",
      code: generateCode(),
      host_id: user.id,
      status: "full" satisfies RoomStatus,
      max_players: 2,
      match_settings: { match_length: 10, mode: "1v1", server: DEFAULT_SERVER },
    })
    .select("id")
    .single();
  if (roomErr || !room)
    return { error: roomErr?.message ?? "No se pudo crear la sala." };

  // Host (retado) por RLS; retador con service role (ya verificamos el desafío).
  await supabase
    .from("room_members")
    .insert({ room_id: room.id, user_id: user.id, role: "host" });
  const admin = createAdminClient();
  await admin
    .from("room_members")
    .insert({ room_id: room.id, user_id: ch.challenger_id, role: "guest" });

  await supabase
    .from("challenges")
    .update({ status: "accepted", room_id: room.id })
    .eq("id", challengeId);

  revalidatePath("/amigos");
  return { ok: true, roomId: room.id };
}
