"use client";

import { useTransition } from "react";
import {
  generateBracket,
  joinTournament,
  leaveTournament,
} from "@/lib/tournaments/actions";

export function JoinTournamentButton({ tournamentId }: { tournamentId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(async () => joinTournament(tournamentId))}
      disabled={pending}
      className="rounded bg-pitch px-4 py-2 text-sm font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-pitch-light disabled:opacity-50"
    >
      {pending ? "…" : "Inscribirme"}
    </button>
  );
}

export function LeaveTournamentButton({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (window.confirm("¿Abandonar el torneo?")) {
          start(async () => leaveTournament(tournamentId));
        }
      }}
      disabled={pending}
      className="rounded border border-carbon-600 px-4 py-2 text-sm uppercase tracking-wider text-neutral-400 transition hover:border-red-800 hover:text-red-400 disabled:opacity-50"
    >
      {pending ? "…" : "Abandonar"}
    </button>
  );
}

export function GenerateBracketButton({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (
          window.confirm(
            "¿Generar el bracket? Se cierran las inscripciones y empieza el torneo."
          )
        ) {
          start(async () => {
            const res = await generateBracket(tournamentId);
            if (res.error) window.alert(res.error);
          });
        }
      }}
      disabled={pending}
      className="rounded bg-gold px-4 py-2 text-sm font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-yellow-300 disabled:opacity-50"
    >
      {pending ? "Generando…" : "Generar bracket"}
    </button>
  );
}
