"use client";

import { useState, useTransition } from "react";
import {
  awardTournamentWin,
  confirmTournamentScore,
  ownerSetTournamentScore,
  reportTournamentScore,
} from "@/lib/tournaments/actions";
import { uploadProof } from "@/lib/proofs/actions";

/** Participante reporta el marcador (sin empates: hay desempate). */
export function TReportForm({ matchId }: { matchId: string }) {
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
      const res = await reportTournamentScore(matchId, h, a, proofUrl);
      if (res.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1.5">
      <input
        type="number"
        min={0}
        max={99}
        value={home}
        onChange={(e) => setHome(e.target.value)}
        className="w-10 rounded border border-carbon-600 bg-carbon-900 px-1 py-0.5 text-center text-xs text-neutral-200 outline-none focus:border-pitch"
      />
      <span className="text-xs text-neutral-500">-</span>
      <input
        type="number"
        min={0}
        max={99}
        value={away}
        onChange={(e) => setAway(e.target.value)}
        className="w-10 rounded border border-carbon-600 bg-carbon-900 px-1 py-0.5 text-center text-xs text-neutral-200 outline-none focus:border-pitch"
      />
      <label
        className="cursor-pointer rounded border border-carbon-600 px-1.5 py-0.5 text-[10px] text-neutral-400 transition hover:border-pitch hover:text-pitch-light"
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
        className="rounded border border-pitch px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pitch-light transition hover:bg-pitch hover:text-carbon-950 disabled:opacity-50"
      >
        Reportar
      </button>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </form>
  );
}

/** El otro participante confirma el marcador reportado. */
export function TConfirmButton({ matchId }: { matchId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (window.confirm("¿Confirmas este marcador?")) {
          start(async () => {
            await confirmTournamentScore(matchId);
          });
        }
      }}
      disabled={pending}
      className="rounded bg-pitch px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-pitch-light disabled:opacity-50"
    >
      {pending ? "…" : "Confirmar"}
    </button>
  );
}

/** Panel del organizador: fijar marcador directo o dar WO. */
export function TOwnerControls({
  matchId,
  homeId,
  homeName,
  awayId,
  awayName,
}: {
  matchId: string;
  homeId: string | null;
  homeName: string;
  awayId: string | null;
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
      const res = await ownerSetTournamentScore(matchId, h, a);
      if (res.error) setError(res.error);
    });
  }

  function award(winnerId: string, winnerName: string) {
    if (!window.confirm(`¿WO para ${winnerName}? Queda 3-0.`)) return;
    start(async () => {
      await awardTournamentWin(matchId, winnerId);
    });
  }

  return (
    <div className="mt-1.5 space-y-1 border-t border-carbon-700 pt-1.5">
      <form onSubmit={submit} className="flex items-center gap-1.5">
        <span className="text-[9px] uppercase tracking-wider text-neutral-500">
          Org:
        </span>
        <input
          type="number"
          min={0}
          max={99}
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="w-9 rounded border border-carbon-600 bg-carbon-900 px-1 py-0.5 text-center text-[11px] text-neutral-200 outline-none focus:border-gold"
        />
        <span className="text-[10px] text-neutral-500">-</span>
        <input
          type="number"
          min={0}
          max={99}
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="w-9 rounded border border-carbon-600 bg-carbon-900 px-1 py-0.5 text-center text-[11px] text-neutral-200 outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={pending || home === "" || away === ""}
          className="rounded border border-gold/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-gold transition hover:bg-gold/10 disabled:opacity-50"
        >
          Fijar
        </button>
      </form>
      {homeId && awayId && (
        <div className="flex items-center gap-1">
          <span className="text-[9px] uppercase tracking-wider text-neutral-500">
            WO:
          </span>
          <button
            onClick={() => award(homeId, homeName)}
            disabled={pending}
            className="rounded border border-red-800/60 px-1.5 py-0.5 text-[9px] uppercase text-red-400 transition hover:bg-red-950 disabled:opacity-50"
          >
            {homeName}
          </button>
          <button
            onClick={() => award(awayId, awayName)}
            disabled={pending}
            className="rounded border border-red-800/60 px-1.5 py-0.5 text-[9px] uppercase text-red-400 transition hover:bg-red-950 disabled:opacity-50"
          >
            {awayName}
          </button>
        </div>
      )}
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
