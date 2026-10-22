import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  ApplySwapButton,
  CreateLowerDivisionButton,
  FinishLeagueButton,
  GenerateFixtureButton,
  JoinLeagueButton,
  LeaveLeagueButton,
  ResetSeasonButton,
} from "@/components/league-buttons";
import {
  AwardWinButtons,
  ConfirmScoreButton,
  ReportScoreForm,
  SetDateForm,
} from "@/components/league-match-actions";
import type { League, LeagueMatch, LeagueMember } from "@/types/database";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  draft: "Inscripciones abiertas",
  active: "En curso",
  finished: "Finalizada",
};

interface Row {
  user_id: string;
  username: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  pts: number;
}

export default async function LigaDetailPage({
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

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", id)
    .single<League>();
  if (!league) notFound();

  // División inferior enlazada (si existe) y liga padre (si esta es hija).
  const { data: child } = await supabase
    .from("leagues")
    .select("id, name, status")
    .eq("parent_league_id", id)
    .maybeSingle();
  const { data: parent } = league.parent_league_id
    ? await supabase
        .from("leagues")
        .select("id, name")
        .eq("id", league.parent_league_id)
        .single()
    : { data: null };

  const [{ data: members }, { data: matches }] = await Promise.all([
    supabase
      .from("league_members")
      .select("*, profile:profiles(*)")
      .eq("league_id", id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("league_matches")
      .select(
        "*, home:profiles!league_matches_home_user_id_fkey(*), away:profiles!league_matches_away_user_id_fkey(*)"
      )
      .eq("league_id", id)
      .order("matchday", { ascending: true }),
  ]);

  const memberList = (members as LeagueMember[]) ?? [];
  const matchList = (matches as LeagueMatch[]) ?? [];
  const isOwner = user?.id === league.created_by;
  const isMember = memberList.some((m) => m.user_id === user?.id);

  // Tabla de posiciones: solo cuentan partidos 'played'.
  const table = new Map<string, Row>();
  for (const m of memberList) {
    table.set(m.user_id, {
      user_id: m.user_id,
      username: m.profile?.username ?? "?",
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      pts: 0,
    });
  }
  for (const m of matchList) {
    if (m.status !== "played" || m.home_score == null || m.away_score == null)
      continue;
    const h = table.get(m.home_user_id);
    const a = table.get(m.away_user_id);
    if (!h || !a) continue;
    h.pj++; a.pj++;
    h.gf += m.home_score; h.gc += m.away_score;
    a.gf += m.away_score; a.gc += m.home_score;
    if (m.home_score > m.away_score) { h.pg++; a.pp++; h.pts += 3; }
    else if (m.home_score < m.away_score) { a.pg++; h.pp++; a.pts += 3; }
    else { h.pe++; a.pe++; h.pts++; a.pts++; }
  }
  const standings = [...table.values()].sort(
    (x, y) => y.pts - x.pts || y.gf - y.gc - (x.gf - x.gc) || y.gf - x.gf
  );

  const matchdays = new Map<number, LeagueMatch[]>();
  for (const m of matchList) {
    const arr = matchdays.get(m.matchday) ?? [];
    arr.push(m);
    matchdays.set(m.matchday, arr);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
            {league.name}
          </h1>
          <p className="text-sm uppercase tracking-wider text-neutral-500">
            {STATUS[league.status]} · {memberList.length}
            {league.max_members ? `/${league.max_members}` : ""} participantes
            {league.division && league.division > 1
              ? ` · División ${league.division}`
              : ""}
            {league.relegation_size
              ? ` · ${league.relegation_size} ${league.relegation_size === 1 ? "ascenso" : "ascensos"}`
              : ""}
          </p>
        </div>
        <Link href="/ligas" className="text-sm text-neutral-400 underline">
          ← Todas las ligas
        </Link>
      </div>

      {league.description && (
        <p className="mt-4 text-neutral-400">{league.description}</p>
      )}

      {/* Enlaces entre divisiones */}
      {(parent || child) && (
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {parent && (
            <Link
              href={`/ligas/${parent.id}`}
              className="text-pitch-light hover:text-pitch"
            >
              ↑ Primera división: {parent.name}
            </Link>
          )}
          {child && (
            <Link
              href={`/ligas/${child.id}`}
              className="text-gold hover:text-yellow-300"
            >
              ↓ Liga de ascenso: {child.name}
            </Link>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {league.status === "draft" && user && !isMember && (
          memberList.length >= (league.max_members ?? 16) ? (
            <span className="rounded border border-red-800/60 px-4 py-2 text-sm uppercase tracking-wider text-red-400">
              Liga llena
              {child ? " — abajo tienes la de ascenso" : ""}
            </span>
          ) : (
            <JoinLeagueButton leagueId={id} />
          )
        )}
        {league.status === "draft" && isMember && !isOwner && (
          <LeaveLeagueButton leagueId={id} />
        )}
        {league.status === "draft" && isOwner && (
          <>
            <GenerateFixtureButton leagueId={id} memberCount={memberList.length} />
            {(league.relegation_size ?? 0) > 0 && !child && (
              <CreateLowerDivisionButton leagueId={id} />
            )}
          </>
        )}
        {league.status === "active" && isOwner && (
          <FinishLeagueButton leagueId={id} />
        )}
        {league.status === "finished" && isOwner && (
          <>
            {(league.relegation_size ?? 0) > 0 && child && !league.swapped && (
              <ApplySwapButton leagueId={id} />
            )}
            <ResetSeasonButton leagueId={id} />
          </>
        )}
      </div>

      {/* Participantes */}
      <section className="mt-8">
        <h2 className="font-sport text-lg font-semibold uppercase tracking-wider">
          Participantes
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {memberList.map((m) => (
            <span
              key={m.user_id}
              className="rounded-full border border-carbon-600 bg-carbon-800 px-3 py-1 text-sm text-neutral-300"
            >
              {m.profile?.username ?? "Jugador"}
              {m.user_id === league.created_by && (
                <span className="ml-1 text-xs text-gold">★ org.</span>
              )}
            </span>
          ))}
        </div>
      </section>

      {/* Tabla de posiciones — visible para todos */}
      <section className="mt-8">
        <h2 className="font-sport text-lg font-semibold uppercase tracking-wider text-pitch-light">
          Tabla de posiciones
        </h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-carbon-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-carbon-700 bg-carbon-800 text-left text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Jugador</th>
                <th className="px-3 py-2 text-center">PJ</th>
                <th className="px-3 py-2 text-center">G</th>
                <th className="px-3 py-2 text-center">E</th>
                <th className="px-3 py-2 text-center">P</th>
                <th className="px-3 py-2 text-center">GF</th>
                <th className="px-3 py-2 text-center">GC</th>
                <th className="px-3 py-2 text-center">DG</th>
                <th className="px-3 py-2 text-center font-bold text-pitch-light">
                  PTS
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((r, i) => (
                <tr
                  key={r.user_id}
                  className={`border-b border-carbon-800 ${
                    i === 0 ? "bg-gold/5" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-neutral-500">{i + 1}</td>
                  <td className="px-3 py-2 font-semibold text-neutral-200">
                    {r.username}
                  </td>
                  <td className="px-3 py-2 text-center text-neutral-400">{r.pj}</td>
                  <td className="px-3 py-2 text-center text-pitch-light">{r.pg}</td>
                  <td className="px-3 py-2 text-center text-neutral-400">{r.pe}</td>
                  <td className="px-3 py-2 text-center text-red-400">{r.pp}</td>
                  <td className="px-3 py-2 text-center text-neutral-400">{r.gf}</td>
                  <td className="px-3 py-2 text-center text-neutral-400">{r.gc}</td>
                  <td className="px-3 py-2 text-center text-neutral-400">
                    {r.gf - r.gc}
                  </td>
                  <td className="scoreboard px-3 py-2 text-center font-bold text-pitch-light">
                    {r.pts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Calendario por jornadas */}
      {matchdays.size > 0 && (
        <section className="mt-8">
          <h2 className="font-sport text-lg font-semibold uppercase tracking-wider">
            Calendario
          </h2>
          <div className="mt-3 space-y-6">
            {[...matchdays.entries()].map(([day, dayMatches]) => (
              <div key={day}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">
                  Jornada {day}
                </h3>
                <ul className="mt-2 space-y-2">
                  {dayMatches.map((m) => {
                    const isParticipant =
                      user &&
                      (m.home_user_id === user.id ||
                        m.away_user_id === user.id);
                    const waitingMe =
                      m.status === "pending_confirm" &&
                      m.reported_by !== user?.id;
                    return (
                      <li
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-carbon-700 bg-carbon-800 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-28 truncate text-sm font-semibold text-neutral-200">
                            {m.home?.username ?? "?"}
                          </span>
                          <span className="scoreboard min-w-16 text-center font-sport text-lg font-bold">
                            {m.status === "played" ||
                            m.status === "pending_confirm" ? (
                              <>
                                {m.home_score}{" "}
                                <span className="text-neutral-500">-</span>{" "}
                                {m.away_score}
                              </>
                            ) : (
                              <span className="text-neutral-600">vs</span>
                            )}
                          </span>
                          <span className="w-28 truncate text-sm font-semibold text-neutral-200">
                            {m.away?.username ?? "?"}
                          </span>
                          {m.status === "pending_confirm" && (
                            <span className="rounded border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
                              Por confirmar
                            </span>
                          )}
                          {m.proof_url && (
                            <a
                              href={m.proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] uppercase tracking-wider text-sky-300 hover:text-sky-200"
                            >
                              📷 Captura
                            </a>
                          )}
                        </div>
                        {m.scheduled_at && (
                          <p className="mt-1 text-xs text-neutral-500">
                            🗓{" "}
                            {new Date(m.scheduled_at).toLocaleString("es", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          {m.status === "scheduled" &&
                            (isParticipant || isOwner) && (
                              <SetDateForm matchId={m.id} />
                            )}
                          {isParticipant &&
                            (m.status === "scheduled" ||
                              (m.status === "pending_confirm" &&
                                m.reported_by === user.id)) && (
                              <ReportScoreForm
                                matchId={m.id}
                                homeName={m.home?.username ?? "Local"}
                                awayName={m.away?.username ?? "Visita"}
                              />
                            )}
                          {isParticipant && waitingMe && (
                            <ConfirmScoreButton matchId={m.id} />
                          )}
                          {isOwner &&
                            (m.status === "scheduled" ||
                              m.status === "pending_confirm") && (
                              <AwardWinButtons
                                matchId={m.id}
                                homeId={m.home_user_id}
                                homeName={m.home?.username ?? "Local"}
                                awayId={m.away_user_id}
                                awayName={m.away?.username ?? "Visita"}
                              />
                            )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
