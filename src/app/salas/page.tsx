import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { joinRoom, type RoomActionResult } from "@/lib/rooms/actions";
import { JoinByCodeForm } from "@/components/join-by-code-form";
import type { Room } from "@/types/database";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  waiting: { label: "Esperando", cls: "text-gold border-gold/40" },
  full: { label: "Completa", cls: "text-pitch-light border-pitch/40" },
  connecting: { label: "Conectando", cls: "text-sky-400 border-sky-400/40" },
  in_game: { label: "En partida", cls: "text-pitch border-pitch" },
  finished: { label: "Finalizada", cls: "text-neutral-500 border-carbon-600" },
};

const MODE_LABEL: Record<string, string> = {
  "1v1": "1v1",
  coop: "Co-op",
  clan: "Clanes",
};

export default async function RoomsPage() {
  const configured = isSupabaseConfigured();
  let rooms: Room[] = [];

  if (configured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .neq("status", "finished")
      .order("created_at", { ascending: false })
      .limit(30);
    rooms = (data as Room[]) ?? [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
          Salas <span className="text-pitch">abiertas</span>
        </h1>
        <Link
          href="/salas/nueva"
          className="rounded bg-pitch px-5 py-2 font-sport font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-pitch-light"
        >
          Crear sala
        </Link>
      </div>

      <div className="mt-6">
        <JoinByCodeForm action={joinRoom} />
      </div>

      {!configured ? (
        <div className="mt-8 rounded-lg border border-gold/30 bg-gold/5 p-6 text-neutral-400">
          Las salas requieren Supabase configurado. En modo demo puedes ver la
          interfaz, pero crear o unirse necesita backend. Consulta el README.
        </div>
      ) : rooms.length === 0 ? (
        <div className="mt-8 rounded-lg border border-carbon-700 bg-carbon-800 p-8 text-center text-neutral-500">
          <p className="uppercase tracking-wider">
            No hay salas abiertas — crea la primera
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => {
            const s = STATUS_LABEL[room.status] ?? STATUS_LABEL.waiting;
            return (
              <li key={room.id}>
                <Link
                  href={`/salas/${room.id}`}
                  className="block rounded-lg border border-carbon-700 bg-carbon-800 p-5 transition hover:border-pitch"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-sport text-lg font-semibold uppercase">
                      {room.name}
                    </h3>
                    <span
                      className={`rounded border px-2 py-0.5 text-xs uppercase tracking-wider ${s.cls}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    Código:{" "}
                    <span className="scoreboard text-pitch-light">
                      {room.code}
                    </span>
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-sky-300">
                    Modo: {MODE_LABEL[room.match_settings?.mode ?? "1v1"]}
                  </p>
                  {room.match_settings?.patch && (
                    <p className="mt-1 text-xs uppercase tracking-wider text-gold">
                      Parche: {room.match_settings.patch}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export type { RoomActionResult };
