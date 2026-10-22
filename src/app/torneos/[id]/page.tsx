import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  GenerateBracketButton,
  JoinTournamentButton,
  LeaveTournamentButton,
} from "@/components/tournament-buttons";
import {
  TConfirmButton,
  TOwnerControls,
  TReportForm,
} from "@/components/tournament-match-actions";
import type {
  Profile,
  Tournament,
  TournamentMatch,
  TournamentMember,
} from "@/types/database";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  draft: "Inscripciones abiertas",
  active: "En curso",
  finished: "Finalizado",
};

function roundName(round: number, total: number) {
  const left = total - round;
  if (left === 0) return "Final";
  if (left === 1) return "Semifinal";
  if (left === 2) return "Cuartos de final";
  if (left === 3) return "Octavos de final";
  return `Ronda ${round}`;
}

function playerCell(
  p: Profile | null | undefined,
  score: number | null,
  isWinner: boolean,
  played: boolean
) {
  const lost = played && !isWinner;
  return (
    <div
      className={`flex items-center justify-between px-3 py-1.5 text-sm ${
        isWinner ? "font-bold text-pitch-light" : lost ? "text-neutral-500 line-through" : "text-neutral-200"
      }`}
    >
      <span className="truncate">{p?.username ?? "— por definir —"}</span>
      {score != null && <span className="ml-2 font-sport font-bold">{score}</span>}
    </div>
  );
}

export default async function TorneoPage({
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

  const { data: t } = await supabase
    .from("tournaments")
    .select("*, winner:profiles!tournaments_winner_id_fkey(*)")
    .eq("id", id)
    .single<Tournament>();
  if (!t) notFound();

  const [{ data: members }, { data: matches }] = await Promise.all([
    supabase
      .from("tournament_members")
      .select("*, profile:profiles(*)")
      .eq("tournament_id", id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("tournament_matches")
      .select(
        "*, home:profiles!tournament_matches_home_user_id_fkey(*), away:profiles!tournament_matches_away_user_id_fkey(*)"
      )
      .eq("tournament_id", id)
      .order("round", { ascending: true })
      .order("slot", { ascending: true }),
  ]);

  const memberList = (members ?? []) as TournamentMember[];
  const matchList = (matches ?? []) as TournamentMatch[];
  const isMember = !!user && memberList.some((m) => m.user_id === user.id);
  const isOwner = !!user && t.created_by === user.id;

  const rounds: TournamentMatch[][] = [];
  for (const m of matchList) {
    (rounds[m.round] ??= []).push(m);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link
        href="/torneos"
        className="text-xs uppercase tracking-wider text-neutral-500 hover:text-gold"
      >
        ← Torneos
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
            <span className="text-gold">{t.name}</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {STATUS[t.status]} · {memberList.length} participantes
            {t.description ? ` · ${t.description}` : ""}
          </p>
        </div>
        {t.status === "draft" && user && (
          <div className="flex gap-2">
            {isMember ? (
              <LeaveTournamentButton tournamentId={id} />
            ) : (
              <JoinTournamentButton tournamentId={id} />
            )}
            {isOwner && memberList.length >= 2 && (
              <GenerateBracketButton tournamentId={id} />
            )}
          </div>
        )}
      </header>

      {t.status === "finished" && t.winner && (
        <div className="mt-6 rounded-lg border border-gold bg-gold/10 p-6 text-center">
          <p className="text-4xl">🏆</p>
          <p className="mt-2 font-sport text-2xl font-bold uppercase tracking-wider text-gold">
            {t.winner.username}
          </p>
          <p className="text-xs uppercase tracking-wider text-neutral-400">
            Campeón del torneo
          </p>
        </div>
      )}

      {/* Lista de inscritos mientras está abierto */}
      {t.status === "draft" && (
        <section className="mt-6 rounded-lg border border-carbon-700 bg-carbon-800 p-5">
          <h2 className="font-sport text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Inscritos ({memberList.length})
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {memberList.map((m) => (
              <li
                key={m.user_id}
                className="rounded border border-carbon-600 bg-carbon-900 px-3 py-1 text-sm text-neutral-300"
              >
                {m.profile?.username ?? "Jugador"}
                {m.user_id === t.created_by && (
                  <span className="ml-1 text-[10px] text-gold">★</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Bracket por rondas */}
      {matchList.length > 0 && (
        <section className="mt-8 overflow-x-auto pb-4">
          <div className="flex gap-6" style={{ minWidth: `${rounds.filter(Boolean).length * 15}rem` }}>
            {rounds.map(
              (matches, i) =>
                matches && (
                  <div key={i} className="w-56 shrink-0">
                    <h2 className="mb-3 text-center font-sport text-sm font-bold uppercase tracking-wider text-gold">
                      {roundName(i, t.rounds)}
                    </h2>
                    <div className="space-y-4">
                      {matches.map((m) => {
                        const iAmHome = user?.id === m.home_user_id;
                        const iAmAway = user?.id === m.away_user_id;
                        const iPlay = iAmHome || iAmAway;
                        const bothPlayers = m.home_user_id && m.away_user_id;
                        const played = m.status === "played";
                        const waitingMe =
                          m.status === "pending_confirm" &&
                          m.reported_by !== user?.id;
                        const dead =
                          played && !m.home_user_id && !m.away_user_id;
                        if (dead) return null;
                        return (
                          <div
                            key={m.id}
                            className={`rounded-lg border bg-carbon-800 ${
                              m.status === "pending_confirm"
                                ? "border-gold/50"
                                : "border-carbon-700"
                            }`}
                          >
                            {playerCell(m.home, m.home_score, played && m.winner_id === m.home_user_id, played)}
                            <div className="border-t border-carbon-700" />
                            {playerCell(m.away, m.away_score, played && m.winner_id === m.away_user_id, played)}
                            {m.status === "pending_confirm" && (
                              <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-gold">
                                Por confirmar
                              </p>
                            )}
                            {m.proof_url && (
                              <p className="px-3 pb-1.5">
                                <a
                                  href={m.proof_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] uppercase tracking-wider text-sky-300 hover:text-sky-200"
                                >
                                  📷 Ver captura
                                </a>
                              </p>
                            )}
                            {user && iPlay && !played && bothPlayers && (
                              <div className="flex items-center gap-2 border-t border-carbon-700 px-3 py-1.5">
                                {waitingMe ? (
                                  <TConfirmButton matchId={m.id} />
                                ) : (
                                  <TReportForm matchId={m.id} />
                                )}
                              </div>
                            )}
                            {isOwner && !played && (
                              <div className="px-3 pb-1.5">
                                <TOwnerControls
                                  matchId={m.id}
                                  homeId={m.home_user_id}
                                  homeName={m.home?.username ?? "Local"}
                                  awayId={m.away_user_id}
                                  awayName={m.away?.username ?? "Visita"}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
            )}
          </div>
        </section>
      )}
    </div>
  );
}
