"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LeagueResult {
  error?: string;
  ok?: boolean;
}

/** Crea una liga (el creador entra como primer miembro). */
export async function createLeague(
  _prev: LeagueResult,
  formData: FormData
): Promise<LeagueResult> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (name.length < 3 || name.length > 60) {
    return { error: "El nombre debe tener entre 3 y 60 caracteres." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data: league, error } = await supabase
    .from("leagues")
    .insert({ name, description: description || null, created_by: user.id })
    .select("id")
    .single();
  if (error || !league) return { error: error?.message ?? "Error al crear." };

  await supabase
    .from("league_members")
    .insert({ league_id: league.id, user_id: user.id });

  revalidatePath("/ligas");
  redirect(`/ligas/${league.id}`);
}

export async function joinLeague(leagueId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("league_members")
    .insert({ league_id: leagueId, user_id: user.id });
  revalidatePath(`/ligas/${leagueId}`);
}

export async function leaveLeague(leagueId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Solo se puede abandonar mientras la liga no ha empezado.
  const { data: league } = await supabase
    .from("leagues")
    .select("status")
    .eq("id", leagueId)
    .single();
  if (league?.status !== "draft") return;

  await supabase
    .from("league_members")
    .delete()
    .eq("league_id", leagueId)
    .eq("user_id", user.id);
  revalidatePath(`/ligas/${leagueId}`);
}

/**
 * Genera el calendario round-robin (todos contra todos, método del
 * círculo) y marca la liga como activa. Solo el organizador.
 */
export async function generateFixtures(leagueId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: league } = await supabase
    .from("leagues")
    .select("created_by, status")
    .eq("id", leagueId)
    .single();
  if (!league || league.created_by !== user.id || league.status !== "draft")
    return;

  const { data: members } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", leagueId)
    .order("joined_at", { ascending: true });
  const ids = (members ?? []).map((m) => m.user_id);
  if (ids.length < 2) return;

  // Método del círculo: con impar, añadir "bye" (descansa esa jornada).
  const BYE = "__bye__";
  const players = [...ids];
  if (players.length % 2 === 1) players.push(BYE);
  const n = players.length;
  const arr = [...players];

  const fixtures: {
    league_id: string;
    matchday: number;
    home_user_id: string;
    away_user_id: string;
  }[] = [];

  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < n / 2; i++) {
      let home = arr[i];
      let away = arr[n - 1 - i];
      // Alternar local/visitante entre jornadas para equilibrar.
      if (r % 2 === 1) [home, away] = [away, home];
      if (home !== BYE && away !== BYE) {
        fixtures.push({
          league_id: leagueId,
          matchday: r + 1,
          home_user_id: home,
          away_user_id: away,
        });
      }
    }
    // Rotar (arr[0] fijo, el resto gira).
    arr.splice(1, 0, arr.pop()!);
  }

  // Regenerar = borrar lo anterior e insertar de nuevo.
  await supabase.from("league_matches").delete().eq("league_id", leagueId);
  await supabase.from("league_matches").insert(fixtures);
  await supabase
    .from("leagues")
    .update({ status: "active" })
    .eq("id", leagueId);

  revalidatePath(`/ligas/${leagueId}`);
}

/** Un participante reporta el marcador → queda pendiente de confirmar. */
export async function reportScore(
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<LeagueResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };
  if (homeScore < 0 || awayScore < 0 || homeScore > 99 || awayScore > 99) {
    return { error: "Marcador inválido." };
  }

  const { data: match } = await supabase
    .from("league_matches")
    .select("league_id, home_user_id, away_user_id, status")
    .eq("id", matchId)
    .single();
  if (
    !match ||
    (match.home_user_id !== user.id && match.away_user_id !== user.id)
  ) {
    return { error: "No juegas este partido." };
  }
  if (match.status !== "scheduled" && match.status !== "pending_confirm") {
    return { error: "Este partido ya está cerrado." };
  }

  await supabase
    .from("league_matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      reported_by: user.id,
      status: "pending_confirm",
    })
    .eq("id", matchId);

  revalidatePath(`/ligas/${match.league_id}`);
  return { ok: true };
}

/** El rival confirma el marcador reportado → partido jugado. */
export async function confirmScore(matchId: string): Promise<LeagueResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data: match } = await supabase
    .from("league_matches")
    .select(
      "league_id, home_user_id, away_user_id, status, reported_by"
    )
    .eq("id", matchId)
    .single();
  if (!match || match.status !== "pending_confirm")
    return { error: "Nada que confirmar." };
  if (match.reported_by === user.id)
    return { error: "Debe confirmar el otro jugador." };
  if (match.home_user_id !== user.id && match.away_user_id !== user.id)
    return { error: "No juegas este partido." };

  await supabase
    .from("league_matches")
    .update({ status: "played" })
    .eq("id", matchId);

  revalidatePath(`/ligas/${match.league_id}`);
  return { ok: true };
}

/** El organizador fija un marcador directamente (resuelve disputas). */
export async function ownerSetScore(
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: match } = await supabase
    .from("league_matches")
    .select("league_id, league:leagues(created_by)")
    .eq("id", matchId)
    .single();
  const league = match?.league as unknown as { created_by: string } | null;
  if (!match || league?.created_by !== user.id) return;

  await supabase
    .from("league_matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      reported_by: user.id,
      status: "played",
    })
    .eq("id", matchId);

  revalidatePath(`/ligas/${match.league_id}`);
}

/**
 * Fija la fecha/hora del partido. Puede hacerlo el organizador o
 * cualquiera de los dos jugadores (se usa para acordar la fecha).
 */
export async function setMatchDate(
  matchId: string,
  isoDate: string
): Promise<LeagueResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };
  if (!isoDate || isNaN(Date.parse(isoDate)))
    return { error: "Fecha inválida." };

  const { data: match } = await supabase
    .from("league_matches")
    .select(
      "league_id, home_user_id, away_user_id, status, league:leagues(created_by)"
    )
    .eq("id", matchId)
    .single();
  const league = match?.league as unknown as { created_by: string } | null;
  const isParticipant =
    match?.home_user_id === user.id || match?.away_user_id === user.id;
  const isOwner = league?.created_by === user.id;
  if (!match || (!isParticipant && !isOwner))
    return { error: "Sin permiso sobre este partido." };
  if (match.status !== "scheduled")
    return { error: "Solo se puede agendar antes de jugarlo." };

  await supabase
    .from("league_matches")
    .update({ scheduled_at: new Date(isoDate).toISOString() })
    .eq("id", matchId);

  revalidatePath(`/ligas/${match.league_id}`);
  return { ok: true };
}

/**
 * Victoria por no presentarse (WO): el organizador le da el partido 3-0
 * al jugador que sí se presentó. Estándar del fútbol.
 */
export async function awardWin(
  matchId: string,
  winnerId: string
): Promise<LeagueResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data: match } = await supabase
    .from("league_matches")
    .select(
      "league_id, home_user_id, away_user_id, status, league:leagues(created_by)"
    )
    .eq("id", matchId)
    .single();
  const league = match?.league as unknown as { created_by: string } | null;
  if (!match || league?.created_by !== user.id)
    return { error: "Solo el organizador puede dar victorias por default." };
  if (match.status === "played" || match.status === "cancelled")
    return { error: "Este partido ya está cerrado." };

  const homeWon = winnerId === match.home_user_id;
  const awayWon = winnerId === match.away_user_id;
  if (!homeWon && !awayWon) return { error: "El ganador no juega aquí." };

  await supabase
    .from("league_matches")
    .update({
      home_score: homeWon ? 3 : 0,
      away_score: awayWon ? 3 : 0,
      reported_by: user.id,
      status: "played",
    })
    .eq("id", matchId);

  revalidatePath(`/ligas/${match.league_id}`);
  return { ok: true };
}

export async function finishLeague(leagueId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("leagues")
    .update({ status: "finished" })
    .eq("id", leagueId)
    .eq("created_by", user.id);

  revalidatePath("/ligas");
}
