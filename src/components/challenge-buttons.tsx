"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { respondChallenge, sendChallenge } from "@/lib/challenges/actions";

/** Botón "Desafiar" en la página de rivalidad o perfil público. */
export function ChallengeButton({ userId }: { userId: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [pending, start] = useTransition();

  function send() {
    start(async () => {
      const res = await sendChallenge(userId);
      if (res.error) setError(res.error);
      else if (res.roomId) router.push(`/salas/${res.roomId}`);
      else setSent(true);
    });
  }

  if (sent)
    return (
      <span className="rounded border border-gold/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
        Desafío enviado ⚔️
      </span>
    );

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={send}
        disabled={pending}
        className="rounded border border-gold px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gold transition hover:bg-gold hover:text-carbon-950 disabled:opacity-50"
      >
        {pending ? "…" : "⚔ Desafiar"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </span>
  );
}

/** Aceptar / rechazar un desafío recibido, o cancelar el propio. */
export function ChallengeActions({
  challengeId,
  incoming,
}: {
  challengeId: string;
  incoming: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [pending, start] = useTransition();

  function respond(accept: boolean) {
    start(async () => {
      const res = await respondChallenge(challengeId, accept);
      if (res.error) setError(res.error);
      else if (res.roomId) router.push(`/salas/${res.roomId}`);
      else router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      {incoming ? (
        <>
          <button
            onClick={() => respond(true)}
            disabled={pending}
            className="rounded bg-pitch px-3 py-1 text-xs font-bold uppercase tracking-wider text-carbon-950 hover:bg-pitch-light disabled:opacity-50"
          >
            Aceptar desafío
          </button>
          <button
            onClick={() => respond(false)}
            disabled={pending}
            className="rounded border border-carbon-600 px-3 py-1 text-xs uppercase tracking-wider text-neutral-400 hover:border-red-800 hover:text-red-400 disabled:opacity-50"
          >
            Rechazar
          </button>
        </>
      ) : (
        <button
          onClick={() => respond(false)}
          disabled={pending}
          className="rounded border border-carbon-600 px-3 py-1 text-xs uppercase tracking-wider text-neutral-400 hover:border-red-800 hover:text-red-400 disabled:opacity-50"
        >
          Cancelar desafío
        </button>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </span>
  );
}
