import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { League } from "@/types/database";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Inscripciones", cls: "text-gold border-gold/40" },
  active: { label: "En curso", cls: "text-pitch-light border-pitch/40" },
  finished: { label: "Finalizada", cls: "text-neutral-500 border-carbon-600" },
};

export default async function LigasPage() {
  const configured = isSupabaseConfigured();
  let leagues: League[] = [];

  if (configured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("leagues")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    leagues = (data as League[]) ?? [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
          <span className="text-pitch">Ligas</span>
        </h1>
        <Link
          href="/ligas/nueva"
          className="rounded bg-pitch px-5 py-2 font-sport font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-pitch-light"
        >
          Crear liga
        </Link>
      </div>
      <p className="mt-3 max-w-2xl text-sm text-neutral-400">
        Ligas todos contra todos como el fútbol real: el organizador genera el
        calendario por jornadas, los jugadores reportan los resultados y la
        tabla se actualiza sola. Públicas para todos.
      </p>

      {leagues.length === 0 ? (
        <div className="mt-8 rounded-lg border border-carbon-700 bg-carbon-800 p-8 text-center text-neutral-500">
          <p className="uppercase tracking-wider">
            No hay ligas todavía — crea la primera
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leagues.map((l) => {
            const s = STATUS[l.status] ?? STATUS.draft;
            return (
              <li key={l.id}>
                <Link
                  href={`/ligas/${l.id}`}
                  className="block rounded-lg border border-carbon-700 bg-carbon-800 p-5 transition hover:border-pitch"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-sport text-lg font-semibold uppercase">
                      {l.name}
                    </h3>
                    <span
                      className={`rounded border px-2 py-0.5 text-xs uppercase tracking-wider ${s.cls}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {l.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-neutral-500">
                      {l.description}
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
