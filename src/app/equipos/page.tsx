import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Team } from "@/types/database";

export const dynamic = "force-dynamic";

// Datos de DEMOSTRACIÓN para visualizar el catálogo (is_demo = true).
// No son plantillas oficiales: nombres genéricos de época.
const DEMO_TEAMS: Team[] = [
  { id: "d1", name: "Club Azul y Rojo (Ejemplo)", kind: "club", era: "2005-06", crest_url: null, is_demo: true },
  { id: "d2", name: "Selección Sudamericana (Ejemplo)", kind: "national", era: "2006", crest_url: null, is_demo: true },
  { id: "d3", name: "Leyendas Europeas (Ejemplo)", kind: "classic", era: "Clásico", crest_url: null, is_demo: true },
];

const KIND_LABEL: Record<Team["kind"], string> = {
  club: "Club",
  national: "Selección",
  classic: "Clásico",
};

export default async function TeamsPage() {
  let teams: Team[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("teams")
      .select("*")
      .order("name")
      .limit(100);
    teams = (data as Team[]) ?? [];
  }

  const show = teams.length > 0 ? teams : DEMO_TEAMS;
  const isDemo = teams.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
        Equipos <span className="text-pitch">clásicos</span>
      </h1>

      {isDemo && (
        <p className="mt-3 rounded border border-gold/30 bg-gold/5 px-4 py-2 text-sm text-gold">
          Catálogo de demostración — los equipos reales se cargarán con recursos
          autorizados por la comunidad.
        </p>
      )}

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {show.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-4 rounded-lg border border-carbon-700 bg-carbon-800 p-5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-carbon-600 bg-carbon-900 font-sport text-lg font-bold text-pitch-light">
              {t.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </div>
            <div>
              <p className="font-sport font-semibold uppercase">{t.name}</p>
              <p className="text-xs uppercase tracking-wider text-neutral-500">
                {KIND_LABEL[t.kind]} · {t.era ?? "—"}
                {t.is_demo && " · demo"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
