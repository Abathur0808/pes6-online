"use client";

import { useActionState } from "react";
import { createTournament } from "@/lib/tournaments/actions";

export default function NuevoTorneoPage() {
  const [state, action, pending] = useActionState(createTournament, {});

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
        Crear <span className="text-gold">torneo</span>
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Eliminatoria simple. Las inscripciones quedan abiertas hasta que
        generes el bracket — los byes se reparten solos.
      </p>

      <form
        action={action}
        className="mt-6 space-y-4 rounded-lg border border-carbon-700 bg-carbon-800 p-6"
      >
        <label className="block text-sm uppercase tracking-wide text-neutral-400">
          Nombre del torneo
          <input
            name="name"
            required
            maxLength={60}
            placeholder="Copa PES 6 — Edición retro"
            className="mt-1 w-full rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-neutral-200 outline-none focus:border-pitch"
          />
        </label>
        <label className="block text-sm uppercase tracking-wide text-neutral-400">
          Descripción (opcional)
          <textarea
            name="description"
            rows={3}
            placeholder="Reglas, horarios, premio…"
            className="mt-1 w-full rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-neutral-200 outline-none focus:border-pitch"
          />
        </label>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-gold py-2 font-sport text-lg font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-yellow-300 disabled:opacity-50"
        >
          {pending ? "Creando…" : "Crear torneo"}
        </button>
      </form>
    </div>
  );
}
