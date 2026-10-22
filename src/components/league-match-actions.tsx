"use client";

import { useState, useTransition } from "react";
import { confirmScore, reportScore } from "@/lib/leagues/actions";

/** Formulario para reportar el marcador de un partido de liga. */
export function ReportScoreForm({
  matchId,
  homeName,
  awayName,
}: {
  matchId: string;
  homeName: string;
  awayName: string;
}) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const h = Number(home);
    const a = Number(away);
    if (home === "" || away === "" || isNaN(h) || isNaN(a)) return;
    start(async () => {
      const res = await reportScore(matchId, h, a);
      if (res.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={99}
        value={home}
        onChange={(e) => setHome(e.target.value)}
        className="w-12 rounded border border-carbon-600 bg-carbon-900 px-2 py-1 text-center text-sm text-neutral-200 outline-none focus:border-pitch"
        aria-label={`Goles de ${homeName}`}
      />
      <span className="text-neutral-500">-</span>
      <input
        type="number"
        min={0}
        max={99}
        value={away}
        onChange={(e) => setAway(e.target.value)}
        className="w-12 rounded border border-carbon-600 bg-carbon-900 px-2 py-1 text-center text-sm text-neutral-200 outline-none focus:border-pitch"
        aria-label={`Goles de ${awayName}`}
      />
      <button
        type="submit"
        disabled={pending || home === "" || away === ""}
        className="rounded border border-pitch px-3 py-1 text-xs font-semibold uppercase tracking-wider text-pitch-light transition hover:bg-pitch hover:text-carbon-950 disabled:opacity-50"
      >
        {pending ? "…" : "Reportar"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </form>
  );
}

/** Confirmar el marcador reportado por el rival. */
export function ConfirmScoreButton({ matchId }: { matchId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (window.confirm("¿Confirmas este marcador?")) {
          start(async () => {
            await confirmScore(matchId);
          });
        }
      }}
      disabled={pending}
      className="rounded bg-pitch px-3 py-1 text-xs font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-pitch-light disabled:opacity-50"
    >
      {pending ? "…" : "Confirmar"}
    </button>
  );
}
