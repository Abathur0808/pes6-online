"use server";

import { createClient } from "@/lib/supabase/server";

export interface ProofResult {
  error?: string;
  url?: string;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — capturas pesadas
const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/** Sube una captura de resultado al bucket proofs. Devuelve la URL pública. */
export async function uploadProof(formData: FormData): Promise<ProofResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const file = formData.get("proof");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Elige una imagen." };
  const ext = ALLOWED[file.type];
  if (!ext) return { error: "Solo JPG, PNG o WebP." };
  if (file.size > MAX_BYTES) return { error: "Máximo 5 MB." };

  const path = `${user.id}/${crypto.randomUUID()}${ext}`;
  const { error } = await supabase.storage
    .from("proofs")
    .upload(path, file, { contentType: file.type });
  if (error) return { error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("proofs").getPublicUrl(path);
  return { url: publicUrl };
}
