import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AddFriendButton } from "@/components/add-friend-button";
import { AchievementBadges } from "@/components/achievement-badges";
import type { Profile } from "@/types/database";

export const dynamic = "force-dynamic";

function winRate(p: Profile) {
  if (p.matches_played === 0) return "—";
  return `${Math.round((p.wins / p.matches_played) * 100)}%`;
}

/** Perfil público de cualquier jugador. */
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/");
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (id === user.id) redirect("/perfil");

  const [{ data: profile }, { data: commends }, { data: friendship }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single<Profile>(),
      supabase.from("commends").select("tag").eq("to_id", id),
      supabase
        .from("friendships")
        .select("id, status, requester_id")
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user.id})`
        )
        .maybeSingle(),
    ]);
  if (!profile) notFound();

  const commendCount = (tag: string) =>
    (commends ?? []).filter((c: { tag: string }) => c.tag === tag).length;
  const totalCommends = (commends ?? []).length;
  const isFriend = friendship?.status === "accepted";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-center gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.username}
            className="h-16 w-16 rounded-full border border-carbon-600 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pitch font-sport text-2xl font-bold text-carbon-950">
            {(profile.username ?? "?")[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
            {profile.username}
          </h1>
          <p className="text-sm text-neutral-500">
            Miembro desde{" "}
            {new Date(profile.created_at).toLocaleDateString("es")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isFriend ? (
            <Link
              href={`/amigos/${id}`}
              className="rounded border border-gold/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold transition hover:bg-gold/10"
            >
              Ver rivalidad
            </Link>
          ) : (
            <AddFriendButton addresseeId={id} username={profile.username} />
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Partidos", value: profile.matches_played },
          { label: "Victorias", value: profile.wins },
          { label: "Empates", value: profile.draws },
          { label: "Derrotas", value: profile.losses },
          { label: "% Victorias", value: winRate(profile) },
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

      <div className="mt-6 rounded-lg border border-gold/30 bg-gold/5 p-5">
        <h2 className="font-sport text-sm font-semibold uppercase tracking-wider text-gold">
          Reputación
        </h2>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-300">
          <span>
            🤝 Juego limpio: <strong>{commendCount("fair_play")}</strong>
          </span>
          <span>
            ⚽ Buen partido: <strong>{commendCount("good_game")}</strong>
          </span>
          <span>
            🕐 Puntual: <strong>{commendCount("punctual")}</strong>
          </span>
        </div>
      </div>

      <div className="mt-6">
        <AchievementBadges
          matches={profile.matches_played}
          wins={profile.wins}
          commends={totalCommends}
        />
      </div>
    </div>
  );
}
