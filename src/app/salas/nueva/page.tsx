"use client";

import { useActionState } from "react";
import { createRoom, type RoomActionResult } from "@/lib/rooms/actions";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const initial: RoomActionResult = {};

export default function NewRoomPage() {
  const [state, formAction, pending] = useActionState(createRoom, initial);

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-neutral-400">
        <h1 className="font-sport text-3xl font-bold uppercase text-neutral-200">
          Crear sala
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
        Nueva <span className="text-pitch">sala</span>
      </h1>

      <form
        action={formAction}
        className="mt-8 space-y-4 rounded-lg border border-carbon-700 bg-carbon-800 p-6"
      >
        <label className="block text-sm uppercase tracking-wide text-neutral-400">
          Nombre de la sala
          <input
            name="name"
            type="text"
            required
            maxLength={60}
            placeholder="Clásico del domingo"
            className="mt-1 w-full rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-neutral-200 outline-none focus:border-pitch"
          />
        </label>

        <label className="block text-sm uppercase tracking-wide text-neutral-400">
          Modo de juego
          <select
            name="mode"
            defaultValue="1v1"
            className="mt-1 w-full rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-neutral-200 outline-none focus:border-pitch"
          >
            <option value="1v1">1v1 — duelo clásico</option>
            <option value="coop">Co-op — varios jugadores en un mismo PC</option>
            <option value="clan">Duelo de clanes — serie de 1v1 por equipo</option>
          </select>
        </label>
        <p className="text-xs text-neutral-500">
          El netcode de PES 6 es 1v1: en co-op y clanes la sala coordina a tu
          equipo y el partido se juega como 1v1 (o co-op local con mandos
          extra). Ver{" "}
          <a href="/modos" className="text-pitch-light underline">
            modos de juego
          </a>
          .
        </p>

        <label className="block text-sm uppercase tracking-wide text-neutral-400">
          Parche / roster requerido
          <select
            name="patch"
            defaultValue=""
            className="mt-1 w-full rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-neutral-200 outline-none focus:border-pitch"
          >
            <option value="">Cualquiera / sin parche</option>
            <option value="PECH Classic Patch">PECH Classic Patch</option>
            <option value="Original (sin parche)">Original (sin parche)</option>
            <option value="Otro">Otro (acordar con el rival)</option>
          </select>
        </label>
        <p className="text-xs text-neutral-500">
          Ambos jugadores deben tener el mismo parche o el partido
          desincroniza.
        </p>

        <label className="block text-sm uppercase tracking-wide text-neutral-400">
          Servidor de red
          <select
            name="server"
            defaultValue="PES6Club"
            className="mt-1 w-full rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-neutral-200 outline-none focus:border-pitch"
          >
            <option value="PES6Club">PES6Club (recomendado)</option>
            <option value="Personalizado">
              Personalizado — acordar IPs por el chat
            </option>
          </select>
        </label>
        <p className="text-xs text-neutral-500">
          Ambos jugadores conectan al mismo servidor. La sala genera un{" "}
          <code>launcher.config.json</code> listo para el launcher.
        </p>

        <label className="block text-sm uppercase tracking-wide text-neutral-400">
          Jugadores en la sala
          <select
            name="max_players"
            defaultValue="2"
            className="mt-1 w-full rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-neutral-200 outline-none focus:border-pitch"
          >
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} {n === 2 ? "(1v1)" : "jugadores"}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-neutral-500">
          Más de 2 = sala lobby para co-op o duelo de clanes (el partido
          sigue siendo 1v1 en el juego).
        </p>

        <label className="block text-sm uppercase tracking-wide text-neutral-400">
          Duración del partido
          <select
            name="match_length"
            defaultValue="10"
            className="mt-1 w-full rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-neutral-200 outline-none focus:border-pitch"
          >
            {[5, 10, 15, 20, 30].map((m) => (
              <option key={m} value={m}>
                {m} minutos
              </option>
            ))}
          </select>
        </label>

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
          {pending ? "Creando…" : "Crear sala"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-neutral-500">
        La sala coordina a los jugadores. El partido se juega con tu copia de
        PES 6 — ver{" "}
        <a href="/como-jugar" className="text-pitch-light underline">
          cómo jugar
        </a>
        .
      </p>
    </div>
  );
}
