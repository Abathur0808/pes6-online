"use client";

import { useActionState, useState } from "react";
import { uploadAvatar, type AvatarResult } from "@/lib/profile/actions";

const initial: AvatarResult = {};

export function AvatarForm() {
  const [state, formAction, pending] = useActionState(uploadAvatar, initial);
  const [fileName, setFileName] = useState("");

  return (
    <form
      action={formAction}
      className="mt-4 rounded-lg border border-carbon-700 bg-carbon-800 p-4"
    >
      <label className="block text-xs uppercase tracking-wider text-neutral-500">
        Cambiar foto de perfil
        <input
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          required
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
          className="mt-2 block w-full text-sm text-neutral-400 file:mr-3 file:rounded file:border-0 file:bg-carbon-700 file:px-3 file:py-1.5 file:text-sm file:text-neutral-200 hover:file:bg-carbon-600"
        />
      </label>
      <p className="mt-2 text-xs text-neutral-500">
        JPG, PNG o WebP · máx. 2 MB · las imágenes pasan por un filtro de
        contenido automático.
      </p>
      {fileName && (
        <p className="mt-1 text-xs text-neutral-400">{fileName}</p>
      )}
      {state.error && (
        <p className="mt-2 rounded border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="mt-2 text-sm text-pitch-light">Foto actualizada.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded bg-pitch px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-pitch-light disabled:opacity-50"
      >
        {pending ? "Subiendo…" : "Subir foto"}
      </button>
    </form>
  );
}
