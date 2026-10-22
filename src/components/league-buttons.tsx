"use client";

import { useTransition } from "react";
import {
  applyPromotionRelegation,
  createLowerDivision,
  finishLeague,
  generateFixtures,
  joinLeague,
  leaveLeague,
  resetSeason,
} from "@/lib/leagues/actions";

export function JoinLeagueButton({ leagueId }: { leagueId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => joinLeague(leagueId))}
      disabled={pending}
      className="rounded bg-pitch px-4 py-2 text-sm font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-pitch-light disabled:opacity-50"
    >
      {pending ? "Uniendo…" : "Unirme a la liga"}
    </button>
  );
}

export function LeaveLeagueButton({ leagueId }: { leagueId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => leaveLeague(leagueId))}
      disabled={pending}
      className="rounded border border-red-800 px-4 py-2 text-sm uppercase tracking-wider text-red-400 transition hover:bg-red-950 disabled:opacity-50"
    >
      Abandonar liga
    </button>
  );
}

export function GenerateFixtureButton({
  leagueId,
  memberCount,
}: {
  leagueId: string;
  memberCount: number;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (window.confirm("¿Generar el calendario? La liga pasará a activa y no se podrán unir más jugadores.")) {
          start(() => generateFixtures(leagueId));
        }
      }}
      disabled={pending || memberCount < 2}
      className="rounded bg-gold px-4 py-2 text-sm font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-gold/80 disabled:opacity-50"
      title={memberCount < 2 ? "Se necesitan al menos 2 jugadores" : ""}
    >
      {pending ? "Generando…" : "Generar calendario"}
    </button>
  );
}

export function FinishLeagueButton({ leagueId }: { leagueId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (window.confirm("¿Marcar la liga como finalizada?")) {
          start(() => finishLeague(leagueId));
        }
      }}
      disabled={pending}
      className="rounded border border-carbon-600 px-4 py-2 text-sm uppercase tracking-wider text-neutral-400 transition hover:border-gold hover:text-gold disabled:opacity-50"
    >
      Finalizar liga
    </button>
  );
}

/** Crea la división de ascenso enlazada (solo draft, solo organizador). */
export function CreateLowerDivisionButton({ leagueId }: { leagueId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (
          window.confirm(
            "¿Crear la división de ascenso? Quien no entre en la principal podrá inscribirse ahí."
          )
        ) {
          start(async () => {
            const res = await createLowerDivision(leagueId);
            if (res.error) window.alert(res.error);
          });
        }
      }}
      disabled={pending}
      className="rounded border border-pitch/60 px-4 py-2 text-sm uppercase tracking-wider text-pitch-light transition hover:bg-pitch/10 disabled:opacity-50"
    >
      {pending ? "Creando…" : "+ División de ascenso"}
    </button>
  );
}

/** Aplica el intercambio de ascensos/descensos de fin de temporada. */
export function ApplySwapButton({ leagueId }: { leagueId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (
          window.confirm(
            "¿Aplicar ascensos y descensos? Los últimos de esta liga bajan y los mejores de la división de ascenso suben."
          )
        ) {
          start(async () => {
            const res = await applyPromotionRelegation(leagueId);
            if (res.error) window.alert(res.error);
          });
        }
      }}
      disabled={pending}
      className="rounded bg-gold px-4 py-2 text-sm font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-yellow-300 disabled:opacity-50"
    >
      {pending ? "Aplicando…" : "Aplicar ascensos"}
    </button>
  );
}

/** Reinicia la liga a draft para una nueva temporada (borra el calendario). */
export function ResetSeasonButton({ leagueId }: { leagueId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (
          window.confirm(
            "¿Nueva temporada? Se borra el calendario y la liga vuelve a inscripciones con los miembros actuales."
          )
        ) {
          start(async () => {
            const res = await resetSeason(leagueId);
            if (res.error) window.alert(res.error);
          });
        }
      }}
      disabled={pending}
      className="rounded border border-carbon-600 px-4 py-2 text-sm uppercase tracking-wider text-neutral-400 transition hover:border-pitch hover:text-pitch-light disabled:opacity-50"
    >
      Nueva temporada
    </button>
  );
}
