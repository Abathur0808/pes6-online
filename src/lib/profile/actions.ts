"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AvatarResult {
  error?: string;
  ok?: boolean;
}

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/** Reportes necesarios para retirar un avatar y bloquear nuevas subidas. */
const REPORT_THRESHOLD = 3;

export async function uploadAvatar(
  _prev: AvatarResult,
  formData: FormData
): Promise<AvatarResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  // Baneado de avatar tras acumular reportes: no puede subir.
  const { data: me } = await supabase
    .from("profiles")
    .select("avatar_banned")
    .eq("id", user.id)
    .single();
  if (me?.avatar_banned) {
    return {
      error:
        "Tu cuenta está bloqueada para subir fotos tras varios reportes. Contacta con la comunidad.",
    };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elige una imagen." };
  }
  const ext = ALLOWED[file.type];
  if (!ext) return { error: "Solo se permiten JPG, PNG o WebP." };
  if (file.size > MAX_BYTES) return { error: "La imagen no puede superar 2 MB." };

  const path = `${user.id}/avatar${ext}`;
  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) return { error: upErr.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // Cache-buster para que la web recargue la imagen al cambiarla.
  const avatarUrl = `${publicUrl}?v=${Date.now()}`;
  const { error: pErr } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);
  if (pErr) return { error: pErr.message };

  revalidatePath("/perfil");
  revalidatePath("/salas");
  return { ok: true };
}

/**
 * Reporta el avatar de otro usuario. A los REPORT_THRESHOLD reportes
 * distintos, el backend retira la foto y bloquea nuevas subidas.
 * La PK (reported_id, reporter_id) impide reportar dos veces.
 */
export async function reportAvatar(
  reportedId: string
): Promise<AvatarResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };
  if (user.id === reportedId)
    return { error: "No puedes reportarte a ti mismo." };

  const { error } = await supabase
    .from("avatar_reports")
    .insert({ reported_id: reportedId, reporter_id: user.id });

  // Duplicado (23505) = ya lo reportaste; éxito silencioso.
  if (error && error.code === "23505") return { ok: true };
  if (error) return { error: error.message };

  // Contar reportes y aplicar el baneo con service role (salta RLS).
  const admin = createAdminClient();
  const { count } = await admin
    .from("avatar_reports")
    .select("*", { count: "exact", head: true })
    .eq("reported_id", reportedId);

  if ((count ?? 0) >= REPORT_THRESHOLD) {
    const { data: prof } = await admin
      .from("profiles")
      .select("avatar_url")
      .eq("id", reportedId)
      .single();

    if (prof?.avatar_url) {
      // Borrar el archivo del storage (ruta "<uid>/avatar.ext").
      const path = prof.avatar_url.split("/avatars/")[1]?.split("?")[0];
      if (path) await admin.storage.from("avatars").remove([path]);
    }

    await admin
      .from("profiles")
      .update({ avatar_url: null, avatar_banned: true })
      .eq("id", reportedId);
  }

  revalidatePath("/salas");
  return { ok: true };
}
