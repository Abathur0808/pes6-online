"use client";

import { useState, useTransition } from "react";
import { sendFriendRequest } from "@/lib/friends/actions";

/** Botón reutilizable para enviar solicitud de amistad a un usuario. */
export function AddFriendButton({
  addresseeId,
  username,
}: {
  addresseeId: string;
  username: string;
}) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function send() {
    start(async () => {
      const res = await sendFriendRequest(addresseeId);
      if (res.error) setError(res.error);
      else setSent(true);
    });
  }

  if (sent)
    return (
      <span className="rounded border border-pitch/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-pitch-light">
        Solicitud enviada ✓
      </span>
    );

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={send}
        disabled={pending}
        className="rounded bg-pitch px-3 py-1 text-xs font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-pitch-light disabled:opacity-50"
      >
        {pending ? "…" : `+ Agregar a ${username}`}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </span>
  );
}
