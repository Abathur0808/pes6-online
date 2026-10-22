"use client";

import { useActionState } from "react";
import { createLeague, type LeagueResult } from "@/lib/leagues/actions";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const initial: LeagueResult = {};

export default function NuevaLigaPage() {
  const [state, formAction, pending] = useActionState(createLeague, initial);

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-neutral-400">
        <h1 className="font-sport text-3xl font-bold uppercase text-neutral-200">
          Crear liga
        </h1>
        <p className="mt-4">
          Requiere Supabase configurado y sesión iniciada.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="text-center font-sport text-3xl font-bold uppercase tracking-wide">
        Nueva <span className="text-pitch">liga</span>
      </h1>

      <form
        action={formAction}
        className="mt-8 space-y-4 rounded-lg border border-carbon-700 bg-carbon-800 p-6"
      >
        <label className="block text-sm uppercase tracking-wide text-neutral-400">
          Nombre de la liga
          <input
            name="name"
            type="text"
            required
            minLength={3}
            maxLength={60}
            placeholder="Liga de los jueves"
            className="mt-1 w-full rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-neutral-200 outline-none focus:border-pitch"
          />
        </label>

        <label className="block text-sm uppercase tracking-wide text-neutral-400">
          Descripción (opcional)
          <textarea
            name="description"
            rows={3}
            maxLength={500}
            placeholder="Todos contra todos, 10 minutos, PECH Classic…"
            className="mt-1 w-full rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-neutral-200 outline-none focus:border-pitch"
          />
        </label>

        <p className="text-xs text-neutral-500">
          Entras como primer participante. Mientras la liga esté en
          inscripciones cualquiera puede unirse; cuando el organizador genere
          el calendario se cierran las inscripciones.
        </p>

        {state.error && (
          <p className="rounded border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-pitch py-2.5 font-sport font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-pitch-light disabled:opacity-50"
        >
          {pending ? "Creando…" : "Crear liga"}
        </button>
      </form>
    </div>
  );
}
