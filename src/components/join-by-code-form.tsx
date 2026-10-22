"use client";

import { useActionState } from "react";
import type { RoomActionResult } from "@/lib/rooms/actions";

export function JoinByCodeForm({
  action,
}: {
  action: (prev: RoomActionResult, fd: FormData) => Promise<RoomActionResult>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-3 rounded-lg border border-carbon-700 bg-carbon-800 p-4"
    >
      <label className="text-sm uppercase tracking-wide text-neutral-400">
        Unirse por código
      </label>
      <input
        name="code"
        placeholder="ABC123"
        maxLength={6}
        className="scoreboard w-32 rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-center uppercase text-pitch-light outline-none focus:border-pitch"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-pitch px-4 py-2 text-sm font-semibold uppercase tracking-wider text-pitch-light transition hover:bg-pitch hover:text-carbon-950 disabled:opacity-50"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
      {state.error && (
        <span className="text-sm text-red-400">{state.error}</span>
      )}
    </form>
  );
}
