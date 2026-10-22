"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SERVER } from "@/lib/servers";
import type { RoomMode, RoomStatus } from "@/types/database";

export interface RoomActionResult {
  error?: string;
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createRoom(
  _prev: RoomActionResult,
  formData: FormData
): Promise<RoomActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const matchLength = Number(formData.get("match_length") ?? 10);
  const patch = String(formData.get("patch") ?? "").trim();
  const modeRaw = String(formData.get("mode") ?? "1v1");
  const mode: RoomMode = ["1v1", "coop", "clan"].includes(modeRaw)
    ? (modeRaw as RoomMode)
    : "1v1";
  const server = String(formData.get("server") ?? DEFAULT_SERVER).trim();

  if (!name || name.length > 60) {
    return { error: "El nombre de la sala es obligatorio (máx. 60 caracteres)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para crear una sala." };

  const { data: room, error } = await supabase
    .from("rooms")
    .insert({
      name,
      code: generateCode(),
      host_id: user.id,
      status: "waiting" satisfies RoomStatus,
      match_settings: { match_length: matchLength, patch, mode, server },
    })
    .select("id, code")
    .single();

  if (error || !room) {
    return { error: error?.message ?? "No se pudo crear la sala." };
  }

  // El host ocupa su slot automáticamente.
  await supabase.from("room_members").insert({
    room_id: room.id,
    user_id: user.id,
    role: "host",
  });

  revalidatePath("/salas");
  redirect(`/salas/${room.id}`);
}

export async function joinRoom(
  _prev: RoomActionResult,
  formData: FormData
): Promise<RoomActionResult> {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  if (!code) return { error: "Introduce el código de la sala." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para unirte a una sala." };

  const { data: room } = await supabase
    .from("rooms")
    .select("id, status")
    .eq("code", code)
    .single();

  if (!room) return { error: "No existe ninguna sala con ese código." };
  if (room.status === "finished") {
    return { error: "Esta sala ya finalizó." };
  }

  // Comprobar aforo (máx. 2) en servidor vía RLS + count.
  const { count } = await supabase
    .from("room_members")
    .select("*", { count: "exact", head: true })
    .eq("room_id", room.id);

  const { data: existing } = await supabase
    .from("room_members")
    .select("user_id")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    if ((count ?? 0) >= 2) return { error: "La sala está completa." };

    const { error } = await supabase.from("room_members").insert({
      room_id: room.id,
      user_id: user.id,
      role: "guest",
    });
    if (error) return { error: error.message };

    await supabase
      .from("rooms")
      .update({ status: "full" satisfies RoomStatus })
      .eq("id", room.id)
      .eq("status", "waiting");
  }

  revalidatePath(`/salas/${room.id}`);
  redirect(`/salas/${room.id}`);
}

export async function leaveRoom(roomId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", user.id);

  // Si se fue el host, la sala se cierra; si no, vuelve a waiting.
  const { data: room } = await supabase
    .from("rooms")
    .select("host_id")
    .eq("id", roomId)
    .single();

  if (room?.host_id === user.id) {
    await supabase
      .from("rooms")
      .update({ status: "finished" satisfies RoomStatus })
      .eq("id", roomId);
  } else {
    await supabase
      .from("rooms")
      .update({ status: "waiting" satisfies RoomStatus })
      .eq("id", roomId);
  }

  revalidatePath("/salas");
  redirect("/salas");
}

export async function setReady(roomId: string, ready: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("room_members")
    .update({ ready })
    .eq("room_id", roomId)
    .eq("user_id", user.id);

  revalidatePath(`/salas/${roomId}`);
}

export async function setRoomStatus(roomId: string, status: RoomStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Solo el host puede cambiar el estado de la sala.
  await supabase
    .from("rooms")
    .update({ status })
    .eq("id", roomId)
    .eq("host_id", user.id);

  revalidatePath(`/salas/${roomId}`);
}
