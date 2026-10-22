"use client";

import { useTransition } from "react";
import { respondFriendRequest, removeFriend } from "@/lib/friends/actions";

export function FriendActions({
  friendshipId,
  kind,
}: {
  friendshipId: string;
  kind: "incoming" | "outgoing" | "friend";
}) {
  const [pending, start] = useTransition();

  return (
    <span className="flex gap-2">
      {kind === "incoming" && (
        <>
          <button
            onClick={() => start(() => respondFriendRequest(friendshipId, true))}
            disabled={pending}
            className="rounded bg-pitch px-3 py-1 text-xs font-bold uppercase tracking-wider text-carbon-950 hover:bg-pitch-light disabled:opacity-50"
          >
            Aceptar
          </button>
          <button
            onClick={() => start(() => respondFriendRequest(friendshipId, false))}
            disabled={pending}
            className="rounded border border-carbon-600 px-3 py-1 text-xs uppercase tracking-wider text-neutral-400 hover:border-red-800 hover:text-red-400 disabled:opacity-50"
          >
            Rechazar
          </button>
        </>
      )}
      {(kind === "outgoing" || kind === "friend") && (
        <button
          onClick={() => start(() => removeFriend(friendshipId))}
          disabled={pending}
          className="rounded border border-carbon-600 px-3 py-1 text-xs uppercase tracking-wider text-neutral-400 hover:border-red-800 hover:text-red-400 disabled:opacity-50"
        >
          {kind === "friend" ? "Eliminar" : "Cancelar"}
        </button>
      )}
    </span>
  );
}
