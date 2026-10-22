import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AddFriendButton } from "@/components/add-friend-button";
import type { Profile } from "@/types/database";

export const dynamic = "force-dynamic";

const TAG_LABEL: Record<string, string> = {
  fair_play: "Juego limpio",
  good_game: "Buen partido",
  punctual: "Puntual",
};

type H2HResult = "W" | "L" | "D";

interface H2HGame {
  label: string;
  myScore: number;
  theirScore: number;
  result: H2HResult;
  when: string | null;
}

function avatar(p: Profile | null | undefined, size = "h-16 w-16 text-2xl") {
  if (p?.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={p.avatar_url}
        alt={p.username}
        className={`${size} rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      className={`flex ${size} items-center justify-center rounded-full bg-pitch font-sport font-bold text-carbon-950`}
    >
      {(p?.username ?? "?")[0].toUpperCase()}
    </span>
  );
}

export default async function RivalryPage({
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

  const { data: other } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (!other) notFound();
  const rival = other as Profile;

  // Mi perfil para la comparación de carrera.
  const { data: meRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const me = meRow as Profile | null;

  // Estado de amistad.
  const { data: friendship } = await supabase
    .from("friendships")
    .select("id, status, requester_id")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user.id})`
    )
    .maybeSingle();

  // Partidos de sala entre nosotros con resultado verificado.
  const { data: roomGames } = await supabase
    .from("matches")
    .select("played_at, home_user_id, away_user_id, match_results(*)")
    .eq("status", "finished")
    .or(
      `and(home_user_id.eq.${user.id},away_user_id.eq.${id}),and(home_user_id.eq.${id},away_user_id.eq.${user.id})`
    )
    .order("played_at", { ascending: false, nullsFirst: false });

  // Partidos de liga entre nosotros.
  const { data: leagueGames } = await supabase
    .from("league_matches")
    .select(
      "created_at, scheduled_at, status, matchday, home_user_id, away_user_id, home_score, away_score, league:leagues(name)"
    )
    .or(
      `and(home_user_id.eq.${user.id},away_user_id.eq.${id}),and(home_user_id.eq.${id},away_user_id.eq.${user.id})`
    );

  // Elogios cruzados.
  const { data: commends } = await supabase
    .from("commends")
    .select("tag, from_id, to_id")
    .or(
      `and(from_id.eq.${user.id},to_id.eq.${id}),and(from_id.eq.${id},to_id.eq.${user.id})`
    );

  // ---------- Unificar historial ----------
  const games: H2HGame[] = [];

  for (const m of roomGames ?? []) {
    const raw = m.match_results as unknown;
    const r = (Array.isArray(raw) ? raw[0] : raw) as
      | { home_score: number; away_score: number; verified: boolean }
      | null
      | undefined;
    if (!r?.verified) continue;
    const iWasHome = m.home_user_id === user.id;
    const mine = iWasHome ? r.home_score : r.away_score;
    const theirs = iWasHome ? r.away_score : r.home_score;
    games.push({
      label: "Sala",
      myScore: mine,
      theirScore: theirs,
      result: mine > theirs ? "W" : mine < theirs ? "L" : "D",
      when: m.played_at,
    });
  }

  let nextLeagueGame: { league: string; matchday: number; when: string | null } | null =
    null;
  for (const m of leagueGames ?? []) {
    const leagueName =
      (m.league as unknown as { name: string } | null)?.name ?? "Liga";
    if (m.status === "played" && m.home_score != null && m.away_score != null) {
      const iWasHome = m.home_user_id === user.id;
      const mine = iWasHome ? m.home_score : m.away_score;
      const theirs = iWasHome ? m.away_score : m.home_score;
      games.push({
        label: `${leagueName} · J${m.matchday}`,
        myScore: mine,
        theirScore: theirs,
        result: mine > theirs ? "W" : mine < theirs ? "L" : "D",
        when: m.scheduled_at ?? m.created_at,
      });
    } else if (
      (m.status === "scheduled" || m.status === "pending_confirm") &&
      !nextLeagueGame
    ) {
      nextLeagueGame = {
        league: leagueName,
        matchday: m.matchday,
        when: m.scheduled_at,
      };
    }
  }

  games.sort((a, b) => (b.when ?? "").localeCompare(a.when ?? ""));

  // ---------- Estadísticas ----------
  const wins = games.filter((g) => g.result === "W").length;
  const losses = games.filter((g) => g.result === "L").length;
  const draws = games.filter((g) => g.result === "D").length;
  const gf = games.reduce((s, g) => s + g.myScore, 0);
  const ga = games.reduce((s, g) => s + g.theirScore, 0);

  // Racha actual (del más reciente hacia atrás).
  let streak: H2HResult | null = null;
  let streakCount = 0;
  for (const g of games) {
    if (streak === null) streak = g.result;
    if (g.result === streak) streakCount++;
    else break;
  }

  const myCommends = (commends ?? []).filter((c) => c.from_id === user.id);
  const theirCommends = (commends ?? []).filter((c) => c.to_id === user.id);
  const isFriend = friendship?.status === "accepted";
  const pendingOut =
    friendship?.status === "pending" && friendship?.requester_id === user.id;
  const pendingIn =
    friendship?.status === "pending" && friendship?.requester_id === id;

  const careerRow = (label: string, mine: number, theirs: number) => (
    <tr key={label} className="border-t border-carbon-700">
      <td className="px-3 py-2 text-right font-bold text-pitch-light">{mine}</td>
      <td className="px-3 py-2 text-center text-xs uppercase tracking-wider text-neutral-400">
        {label}
      </td>
      <td className="px-3 py-2 font-bold text-red-400">{theirs}</td>
    </tr>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/amigos"
        className="text-xs uppercase tracking-wider text-neutral-500 hover:text-pitch-light"
      >
        ← Amigos
      </Link>

      {/* Cabecera de la rivalidad */}
      <header className="mt-4 flex items-center justify-between rounded-lg border border-carbon-700 bg-carbon-800 p-6">
        <div className="flex items-center gap-4">
          {avatar(me)}
          <div>
            <p className="font-sport text-xl font-bold uppercase text-neutral-100">
              {me?.username ?? "Tú"}
            </p>
            <p className="text-xs text-neutral-500">Tú</p>
          </div>
        </div>
        <span className="font-sport text-3xl font-bold text-gold">VS</span>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-sport text-xl font-bold uppercase text-neutral-100">
              {rival.username}
            </p>
            <p className="text-xs text-neutral-500">
              {isFriend
                ? "Amigo ✓"
                : pendingOut
                  ? "Solicitud enviada"
                  : pendingIn
                    ? "Te envió solicitud"
                    : "Rival"}
            </p>
          </div>
          {avatar(rival)}
        </div>
      </header>

      {!isFriend && !pendingOut && (
        <div className="mt-3">
          <AddFriendButton addresseeId={id} username={rival.username} />
        </div>
      )}

      {/* Marcador de la rivalidad */}
      <section className="mt-6 rounded-lg border border-pitch/40 bg-carbon-800 p-6 text-center">
        <h2 className="font-sport text-sm font-semibold uppercase tracking-wider text-pitch-light">
          Cara a cara — {games.length}{" "}
          {games.length === 1 ? "partido" : "partidos"}
        </h2>
        <div className="mt-4 flex items-center justify-center gap-8 font-sport">
          <div>
            <p className="text-5xl font-bold text-pitch-light">{wins}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-neutral-400">
              Tus victorias
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold text-neutral-300">{draws}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-neutral-400">
              Empates
            </p>
          </div>
          <div>
            <p className="text-5xl font-bold text-red-400">{losses}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-neutral-400">
              Sus victorias
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm text-neutral-300">
          <span>
            Goles: <b className="text-pitch-light">{gf}</b> –{" "}
            <b className="text-red-400">{ga}</b>
          </span>
          {streak && streakCount > 1 && (
            <span className="rounded border border-gold/40 px-2 py-0.5 text-xs uppercase tracking-wider text-gold">
              {streak === "W"
                ? `Racha tuya: ${streakCount}`
                : streak === "L"
                  ? `Racha suya: ${streakCount}`
                  : `${streakCount} empates seguidos`}
            </span>
          )}
        </div>
      </section>

      {/* Próximo enfrentamiento */}
      {nextLeagueGame && (
        <section className="mt-4 rounded-lg border border-sky-400/30 bg-sky-400/5 p-4 text-sm">
          <span className="font-semibold text-sky-300">
            Próximo duelo: {nextLeagueGame.league} · Jornada{" "}
            {nextLeagueGame.matchday}
          </span>
          {nextLeagueGame.when && (
            <span className="ml-2 text-neutral-400">
              🗓{" "}
              {new Date(nextLeagueGame.when).toLocaleString("es", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </section>
      )}

      {/* Comparación de carrera */}
      {me && (
        <section className="mt-6 rounded-lg border border-carbon-700 bg-carbon-800 p-5">
          <h2 className="font-sport text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Comparación de carrera
          </h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-3 py-1 text-right">{me.username ?? "Tú"}</th>
                <th className="px-3 py-1" />
                <th className="px-3 py-1 text-left">{rival.username}</th>
              </tr>
            </thead>
            <tbody>
              {careerRow("Partidos", me.matches_played, rival.matches_played)}
              {careerRow("Victorias", me.wins, rival.wins)}
              {careerRow("Empates", me.draws, rival.draws)}
              {careerRow("Derrotas", me.losses, rival.losses)}
              {careerRow(
                "Winrate",
                me.matches_played
                  ? Math.round((me.wins / me.matches_played) * 100)
                  : 0,
                rival.matches_played
                  ? Math.round((rival.wins / rival.matches_played) * 100)
                  : 0
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* Elogios cruzados */}
      {(myCommends.length > 0 || theirCommends.length > 0) && (
        <section className="mt-6 rounded-lg border border-gold/30 bg-gold/5 p-5 text-sm">
          <h2 className="font-sport text-sm font-semibold uppercase tracking-wider text-gold">
            Respeto mutuo
          </h2>
          <p className="mt-2 text-neutral-300">
            Te elogió {theirCommends.length}× · Lo elogiaste{" "}
            {myCommends.length}×
            {theirCommends.length > 0 && (
              <span className="block mt-1 text-xs text-neutral-400">
                De {rival.username} para ti:{" "}
                {theirCommends.map((c) => TAG_LABEL[c.tag] ?? c.tag).join(", ")}
              </span>
            )}
          </p>
        </section>
      )}

      {/* Historial */}
      <section className="mt-6 rounded-lg border border-carbon-700 bg-carbon-800 p-5">
        <h2 className="font-sport text-sm font-semibold uppercase tracking-wider text-neutral-400">
          Historial de enfrentamientos
        </h2>
        {games.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            Todavía no se han enfrentado — abran una sala y empiecen la
            rivalidad.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {games.slice(0, 15).map((g, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded border border-carbon-700 bg-carbon-900 px-3 py-2 text-sm"
              >
                <span className="text-xs text-neutral-500">{g.label}</span>
                <span className="font-sport font-bold">
                  <span
                    className={
                      g.result === "W"
                        ? "text-pitch-light"
                        : g.result === "L"
                          ? "text-red-400"
                          : "text-neutral-300"
                    }
                  >
                    {g.myScore} – {g.theirScore}
                  </span>
                </span>
                <span className="text-xs text-neutral-500">
                  {g.result === "W" ? "Ganaste" : g.result === "L" ? "Perdiste" : "Empate"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
