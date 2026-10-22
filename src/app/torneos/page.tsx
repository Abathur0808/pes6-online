import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Tournament } from "@/types/database";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Inscripciones", cls: "border-pitch/50 text-pitch-light" },
  active: { label: "En curso", cls: "border-gold/50 text-gold" },
  finished: { label: "Finalizado", cls: "border-carbon-600 text-neutral-500" },
};

export default async function TorneosPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createClient();
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*, winner:profiles!tournaments_winner_id_fkey(username)")
    .order("created_at", { ascending: false });
  const list = (tournaments ?? []) as unknown as (Tournament & {
    winner?: { username: string } | null;
  })[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
            <span className="text-gold">Torneos</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Eliminatorias de la comunidad — bracket, byes y campeón.
          </p>
        </div>
        <Link
          href="/torneos/nueva"
          className="rounded bg-gold px-4 py-2 text-sm font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-yellow-300"
        >
          + Crear torneo
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="mt-8 rounded-lg border border-carbon-700 bg-carbon-800 p-8 text-center">
          <p className="text-4xl">🏆</p>
          <p className="mt-3 text-sm text-neutral-400">
            Todavía no hay torneos — crea el primero.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {list.map((t) => {
            const st = STATUS[t.status] ?? STATUS.draft;
            return (
              <li key={t.id}>
                <Link
                  href={`/torneos/${t.id}`}
                  className="block rounded-lg border border-carbon-700 bg-carbon-800 p-5 transition hover:border-gold/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-sport text-lg font-bold uppercase tracking-wide text-neutral-100">
                      {t.name}
                    </h2>
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </div>
                  {t.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-neutral-400">
                      {t.description}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-neutral-500">
                    {t.status === "finished" && t.winner
                      ? `🏆 Campeón: ${t.winner.username}`
                      : t.status === "active"
                        ? "Bracket en juego — mira las llaves"
                        : "Inscripciones abiertas"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
