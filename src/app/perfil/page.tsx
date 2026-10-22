import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AvatarForm } from "@/components/avatar-form";
import { AchievementBadges } from "@/components/achievement-badges";
import type { Profile } from "@/types/database";

function winRate(p: Profile) {
  if (p.matches_played === 0) return "—";
  return `${Math.round((p.wins / p.matches_played) * 100)}%`;
}

export default async function ProfilePage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  // Elogios recibidos (solo de compañeros de sala verificados).
  const { data: commends } = await supabase
    .from("commends")
    .select("tag")
    .eq("to_id", user.id);
  const commendCount = (tag: string) =>
    (commends ?? []).filter((c: { tag: string }) => c.tag === tag).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center gap-4">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.username}
            className="h-16 w-16 rounded-full border border-carbon-600 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pitch font-sport text-2xl font-bold text-carbon-950">
            {(profile?.username ?? user.email ?? "?")[0].toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
            {profile?.username ?? user.email}
          </h1>
          <p className="text-sm text-neutral-500">
            Miembro desde{" "}
            {new Date(profile?.created_at ?? user.created_at).toLocaleDateString(
              "es"
            )}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Partidos", value: profile?.matches_played ?? 0 },
          { label: "Victorias", value: profile?.wins ?? 0 },
          { label: "Empates", value: profile?.draws ?? 0 },
          { label: "Derrotas", value: profile?.losses ?? 0 },
          { label: "% Victorias", value: profile ? winRate(profile) : "—" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-carbon-700 bg-carbon-800 p-4 text-center"
          >
            <p className="scoreboard font-sport text-3xl font-bold text-pitch-light">
              {s.value}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Reputación — solo elogios verificados, nunca negativos */}
      <div className="mt-6 rounded-lg border border-gold/30 bg-gold/5 p-5">
        <h2 className="font-sport text-sm font-semibold uppercase tracking-wider text-gold">
          Reputación
        </h2>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-300">
          <span>🤝 Juego limpio: <strong>{commendCount("fair_play")}</strong></span>
          <span>⚽ Buen partido: <strong>{commendCount("good_game")}</strong></span>
          <span>🕐 Puntual: <strong>{commendCount("punctual")}</strong></span>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Solo pueden elogiarte jugadores que compartieron sala contigo.
        </p>
      </div>
      <div className="mt-6">
        <AchievementBadges
          matches={profile?.matches_played ?? 0}
          wins={profile?.wins ?? 0}
          commends={(commends ?? []).length}
        />
      </div>

      <AvatarForm />

      <p className="mt-6 text-sm text-neutral-500">
        Ranking competitivo: pendiente de activar cuando los resultados se
        validen en servidor. Las estadísticas actuales son reales de tu cuenta.
      </p>
    </div>
  );
}
