"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

/**
 * Moderación de contenido vía Sightengine (plan gratis ~500 ops/mes).
 * Rechaza desnudos, contenido sexual, gore y menores en contexto sexual.
 * Si las claves no están configuradas, la moderación se omite — el resto
 * de validaciones (tipo, tamaño) siguen aplicando.
 */
async function isSafeImage(
  fileBytes: ArrayBuffer,
  fileName: string
): Promise<boolean> {
  const apiUser = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;
  if (!apiUser || !apiSecret) return true; // moderación desactivada en dev

  try {
    const form = new FormData();
    form.append("models", "nudity-2.1,gore-2.0");
    form.append("api_user", apiUser);
    form.append("api_secret", apiSecret);
    form.append("media", new Blob([fileBytes]), fileName);

    const res = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      body: form,
      cache: "no-store",
    });
    if (!res.ok) return true; // si el moderador falla, no bloquear la subida

    const data = await res.json();
    const nudity = data.nudity ?? {};
    const gore = data.gore ?? {};
    const flagged =
      (nudity.sexual_activity ?? 0) > 0.5 ||
      (nudity.sexual_display ?? 0) > 0.5 ||
      (nudity.erotica ?? 0) > 0.7 ||
      (nudity.suggestive ?? 0) > 0.9 ||
      (gore.prob ?? 0) > 0.5;
    return !flagged;
  } catch {
    return true; // fallo de red en moderador → permitir (revisión manual)
  }
}

export async function uploadAvatar(
  _prev: AvatarResult,
  formData: FormData
): Promise<AvatarResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elige una imagen." };
  }
  const ext = ALLOWED[file.type];
  if (!ext) return { error: "Solo se permiten JPG, PNG o WebP." };
  if (file.size > MAX_BYTES) return { error: "La imagen no puede superar 2 MB." };

  const bytes = await file.arrayBuffer();
  if (!(await isSafeImage(bytes, file.name))) {
    return {
      error:
        "La imagen no pasó el filtro de contenido. Elige una foto apropiada.",
    };
  }

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
