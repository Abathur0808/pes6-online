"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { checkQueue, joinQueue, leaveQueue } from "@/lib/matchmaking/actions";

const POLL_MS = 4_000;

/** Cola de matchmaking: entra, sondea cada 4s y navega a la sala al emparejar. */
export function MatchmakingClient() {
  const [state, setState] = useState<"idle" | "searching" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const router = useRouter();
  const inQueue = useRef(false);
  const [pending, start] = useTransition();

  // Cronómetro visual mientras busca.
  useEffect(() => {
    if (state !== "searching") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  // Sondeo: al buscar, joinQueue (que puede emparejar al instante) + checkQueue periódico.
  useEffect(() => {
    if (state !== "searching") return;
    let alive = true;

    async function join() {
      const res = await joinQueue();
      if (!alive) return;
      if (res.error) {
        setError(res.error);
        setState("error");
        return;
      }
      if (res.roomId) {
        router.push(`/salas/${res.roomId}`);
        return;
      }
      inQueue.current = true;
    }
    join();

    const t = setInterval(async () => {
      const res = await checkQueue();
      if (!alive) return;
      if (res.roomId) router.push(`/salas/${res.roomId}`);
    }, POLL_MS);

    return () => {
      alive = false;
      clearInterval(t);
      // Si sigo en cola y me voy, salgo limpio.
      if (inQueue.current) void leaveQueue();
    };
  }, [state, router]);

  function cancel() {
    start(async () => {
      await leaveQueue();
      inQueue.current = false;
      setState("idle");
      setElapsed(0);
    });
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="mt-8 rounded-lg border border-pitch/40 bg-carbon-800 p-8 text-center">
      {state !== "searching" ? (
        <>
          <p className="text-5xl">🎮</p>
          <p className="mt-4 text-sm text-neutral-400">
            Te emparejamos con otro jugador que esté esperando partido y
            creamos la sala automáticamente.
          </p>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <button
            onClick={() => setState("searching")}
            className="mt-6 rounded bg-pitch px-8 py-3 font-sport text-lg font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-pitch-light"
          >
            Buscar rival
          </button>
        </>
      ) : (
        <>
          <p className="animate-pulse text-5xl">🔎</p>
          <p className="mt-4 font-sport text-xl font-bold uppercase tracking-wider text-pitch-light">
            Buscando rival… {mm}:{ss}
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            Te avisaremos en cuanto haya alguien. Puedes dejar esta pestaña
            abierta.
          </p>
          <button
            onClick={cancel}
            disabled={pending}
            className="mt-6 rounded border border-carbon-600 px-6 py-2 text-sm uppercase tracking-wider text-neutral-400 transition hover:border-red-800 hover:text-red-400 disabled:opacity-50"
          >
            Cancelar
          </button>
        </>
      )}
    </div>
  );
}
