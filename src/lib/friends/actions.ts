"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CommendTag } from "@/types/database";

export interface FriendResult {
  error?: string;
  ok?: boolean;
}

/** Busca perfiles por nombre de usuario (para añadir amigos). */
export async function searchProfiles(query: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || query.trim().length < 2) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .ilike("username", `%${query.trim()}%`)
    .neq("id", user.id)
    .limit(8);
  return data ?? [];
}

/** Envía una solicitud de amistad por user_id. */
export async function sendFriendRequest(
  addresseeId: string
): Promise<FriendResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };
  if (user.id === addresseeId)
    return { error: "No puedes añadirte a ti mismo." };

  // ¿Ya existe relación en cualquier dirección?
  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status, requester_id")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`
    )
    .maybeSingle();

  if (existing) {
    if (existing.status === "accepted")
      return { error: "Ya sois amigos." };
    // Si el otro me la había enviado a mí: aceptarla directamente.
    if (existing.requester_id === addresseeId && existing.status === "pending") {
      await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", existing.id);
      revalidatePath("/amigos");
      return { ok: true };
    }
    return { error: "Ya hay una solicitud pendiente." };
  }

  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: addresseeId,
  });
  if (error) return { error: error.message };

  revalidatePath("/amigos");
  return { ok: true };
}

/** Acepta o rechaza una solicitud (solo el destinatario). */
export async function respondFriendRequest(
  friendshipId: string,
  accept: boolean
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("friendships")
    .update({ status: accept ? "accepted" : "rejected" })
    .eq("id", friendshipId)
    .eq("addressee_id", user.id);

  revalidatePath("/amigos");
}

/** Elimina la amistad (cualquiera de las dos partes). */
export async function removeFriend(friendshipId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  revalidatePath("/amigos");
}

const VALID_TAGS: CommendTag[] = ["fair_play", "good_game", "punctual"];

/**
 * Elogia a un compañero de sala. La policy de la tabla verifica que
 * ambos fueron miembros de esa room — imposible inflar reputación.
 */
export async function commendPlayer(
  roomId: string,
  toId: string,
  tag: CommendTag
): Promise<FriendResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };
  if (!VALID_TAGS.includes(tag)) return { error: "Elogio inválido." };

  const { error } = await supabase
    .from("commends")
    .insert({ room_id: roomId, from_id: user.id, to_id: toId, tag });

  // Duplicado (23505): ya elogiaste con ese tag en esta sala.
  if (error && error.code === "23505") return { ok: true };
  if (error) return { error: error.message };
  return { ok: true };
}
