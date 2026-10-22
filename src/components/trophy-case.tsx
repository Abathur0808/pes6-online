import Link from "next/link";
import { getTrophies } from "@/lib/trophies/actions";

const KIND_META = {
  league: { icon: "🏆", label: "Campeón de liga" },
  tournament: { icon: "🥇", label: "Campeón de torneo" },
} as const;

/** Vitrina de trofeos: ligas y torneos ganados por el jugador. */
export async function TrophyCase({ userId }: { userId: string }) {
  const trophies = await getTrophies(userId);
  if (trophies.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="font-sport text-lg font-semibold uppercase tracking-wider text-gold">
        🏆 Vitrina de trofeos ({trophies.length})
      </h2>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {trophies.map((t) => (
          <li key={`${t.kind}-${t.href}`}>
            <Link
              href={t.href}
              className="flex items-start gap-3 rounded-lg border border-gold/40 bg-gold/5 p-4 transition hover:border-gold"
            >
              <span className="text-3xl">{KIND_META[t.kind].icon}</span>
              <div className="min-w-0">
                <p className="truncate font-sport font-bold uppercase tracking-wide text-gold">
                  {t.name}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                  {KIND_META[t.kind].label}
                  {t.kind === "league" && t.division && t.division > 1
                    ? ` · División ${t.division}`
                    : ""}
                </p>
                {t.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-400">
                    {t.description}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
