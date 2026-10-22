"use client";

import { useState, useTransition } from "react";
import {
  awardWin,
  confirmScore,
  reportScore,
  setMatchDate,
} from "@/lib/leagues/actions";
import { uploadProof } from "@/lib/proofs/actions";

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
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const h = Number(home);
    const a = Number(away);
    if (home === "" || away === "" || isNaN(h) || isNaN(a)) return;
    start(async () => {
      let proofUrl: string | undefined;
      if (file) {
        const fd = new FormData();
        fd.append("proof", file);
        const up = await uploadProof(fd);
        if (up.error) {
          setError(up.error);
          return;
        }
        proofUrl = up.url;
      }
      const res = await reportScore(matchId, h, a, proofUrl);
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
      <label
        className="cursor-pointer rounded border border-carbon-600 px-2 py-1 text-xs text-neutral-400 transition hover:border-pitch hover:text-pitch-light"
        title="Adjuntar captura del resultado (opcional)"
      >
        {file ? "📷✓" : "📷"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
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

/** Fijar la fecha/hora pactada del partido (jugadores u organizador). */
export function SetDateForm({ matchId }: { matchId: string }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value) return;
    start(async () => {
      const res = await setMatchDate(matchId, value);
      if (res.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded border border-carbon-600 bg-carbon-900 px-2 py-1 text-xs text-neutral-200 outline-none focus:border-pitch"
      />
      <button
        type="submit"
        disabled={pending || !value}
        className="rounded border border-sky-400/50 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-sky-300 transition hover:bg-sky-400/10 disabled:opacity-50"
      >
        {pending ? "…" : "Agendar"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </form>
  );
}

/** Botones del organizador para dar la victoria por no presentarse (3-0). */
export function AwardWinButtons({
  matchId,
  homeId,
  homeName,
  awayId,
  awayName,
}: {
  matchId: string;
  homeId: string;
  homeName: string;
  awayId: string;
  awayName: string;
}) {
  const [pending, start] = useTransition();

  function award(winnerId: string, winnerName: string) {
    if (
      !window.confirm(
        `¿Victoria por no presentarse para ${winnerName}? Quedará 3-0.`
      )
    )
      return;
    start(async () => {
      await awardWin(matchId, winnerId);
    });
  }

  return (
    <div
      className="flex items-center gap-1"
      title="Victoria por no presentarse (3-0)"
    >
      <span className="text-[10px] uppercase tracking-wider text-neutral-500">
        WO:
      </span>
      <button
        onClick={() => award(homeId, homeName)}
        disabled={pending}
        className="rounded border border-red-800/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-red-400 transition hover:bg-red-950 disabled:opacity-50"
      >
        {homeName}
      </button>
      <button
        onClick={() => award(awayId, awayName)}
        disabled={pending}
        className="rounded border border-red-800/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-red-400 transition hover:bg-red-950 disabled:opacity-50"
      >
        {awayName}
      </button>
    </div>
  );
}
