"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface TResult {
  error?: string;
  ok?: boolean;
}

// ---------- Crear / inscribirse ----------

export async function createTournament(
  _prev: TResult,
  formData: FormData
): Promise<TResult> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name || name.length > 60) return { error: "Nombre obligatorio (máx. 60)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data: t, error } = await supabase
    .from("tournaments")
    .insert({ name, description, created_by: user.id })
    .select("id")
    .single();
  if (error || !t) return { error: error?.message ?? "Error al crear." };

  await supabase
    .from("tournament_members")
    .insert({ tournament_id: t.id, user_id: user.id });
  redirect(`/torneos/${t.id}`);
}

export async function joinTournament(tournamentId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("tournament_members")
    .upsert({ tournament_id: tournamentId, user_id: user.id });
  revalidatePath(`/torneos/${tournamentId}`);
}

export async function leaveTournament(tournamentId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("tournament_members")
    .delete()
    .eq("tournament_id", tournamentId)
    .eq("user_id", user.id);
  revalidatePath(`/torneos/${tournamentId}`);
}

// ---------- Bracket ----------

/** Avanza al ganador a la siguiente ronda; en la final corona campeón. */
async function advanceWinner(
  admin: ReturnType<typeof createAdminClient>,
  tournamentId: string,
  round: number,
  slot: number,
  winnerId: string,
  rounds: number
): Promise<void> {
  if (round >= rounds) {
    await admin
      .from("tournaments")
      .update({ winner_id: winnerId, status: "finished" })
      .eq("id", tournamentId);
    revalidatePath(`/torneos/${tournamentId}`);
    return;
  }

  const targetSlot = Math.ceil(slot / 2);
  const side = slot % 2 === 1 ? "home_user_id" : "away_user_id";
  await admin
    .from("tournament_matches")
    .update({ [side]: winnerId })
    .eq("tournament_id", tournamentId)
    .eq("round", round + 1)
    .eq("slot", targetSlot);

  // ¿El alimentador hermano está muerto? Entonces el que llegó pasa solo.
  const otherFeeder = slot % 2 === 1 ? slot + 1 : slot - 1;
  const { data: sibling } = await admin
    .from("tournament_matches")
    .select("status, winner_id")
    .eq("tournament_id", tournamentId)
    .eq("round", round)
    .eq("slot", otherFeeder)
    .maybeSingle();
  if (sibling?.status === "played" && sibling.winner_id === null) {
    const { data: target } = await admin
      .from("tournament_matches")
      .select("home_user_id, away_user_id")
      .eq("tournament_id", tournamentId)
      .eq("round", round + 1)
      .eq("slot", targetSlot)
      .single();
    const lone = target?.home_user_id ?? target?.away_user_id;
    const both = target?.home_user_id && target?.away_user_id;
    if (lone && !both) {
      await admin
        .from("tournament_matches")
        .update({ winner_id: lone, status: "played" })
        .eq("tournament_id", tournamentId)
        .eq("round", round + 1)
        .eq("slot", targetSlot);
      await advanceWinner(admin, tournamentId, round + 1, targetSlot, lone, rounds);
    }
  }
}

/** Genera el bracket completo con byes. Solo el organizador, en draft. */
export async function generateBracket(tournamentId: string): Promise<TResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data: t } = await supabase
    .from("tournaments")
    .select("created_by, status")
    .eq("id", tournamentId)
    .single();
  if (!t || t.created_by !== user.id)
    return { error: "Solo el organizador genera el bracket." };
  if (t.status !== "draft") return { error: "El torneo ya empezó." };

  const { data: members } = await supabase
    .from("tournament_members")
    .select("user_id")
    .eq("tournament_id", tournamentId)
    .order("joined_at", { ascending: true });
  const ids = (members ?? []).map((m) => m.user_id);
  if (ids.length < 2)
    return { error: "Se necesitan al menos 2 participantes." };

  // Bracket de potencia de 2 con byes en la primera ronda.
  let size = 2;
  while (size < ids.length) size *= 2;
  const rounds = Math.log2(size);
  const firstRoundMatches = size / 2;

  const rows: Record<string, unknown>[] = [];
  for (let r = 1; r <= rounds; r++) {
    const count = size / 2 ** r;
    for (let s = 1; s <= count; s++) {
      rows.push({
        tournament_id: tournamentId,
        round: r,
        slot: s,
        status: "scheduled",
      });
    }
  }

  const admin = createAdminClient();
  const { error: insErr } = await admin.from("tournament_matches").insert(rows);
  if (insErr) return { error: insErr.message };

  // Sembrar participantes en la ronda 1 por orden de inscripción.
  for (let i = 0; i < ids.length; i++) {
    const slot = Math.floor(i / 2) + 1;
    const side = i % 2 === 0 ? "home_user_id" : "away_user_id";
    await admin
      .from("tournament_matches")
      .update({ [side]: ids[i] })
      .eq("tournament_id", tournamentId)
      .eq("round", 1)
      .eq("slot", slot);
  }

  // Resolver byes y casillas muertas de la ronda 1.
  for (let s = 1; s <= firstRoundMatches; s++) {
    const { data: m } = await admin
      .from("tournament_matches")
      .select("home_user_id, away_user_id")
      .eq("tournament_id", tournamentId)
      .eq("round", 1)
      .eq("slot", s)
      .single();
    if (!m) continue;
    const players = [m.home_user_id, m.away_user_id].filter(Boolean);
    if (players.length === 0) {
      await admin
        .from("tournament_matches")
        .update({ status: "played" })
        .eq("tournament_id", tournamentId)
        .eq("round", 1)
        .eq("slot", s);
    } else if (players.length === 1) {
      await admin
        .from("tournament_matches")
        .update({ winner_id: players[0], status: "played" })
        .eq("tournament_id", tournamentId)
        .eq("round", 1)
        .eq("slot", s);
      await advanceWinner(admin, tournamentId, 1, s, players[0] as string, rounds);
    }
  }

  await supabase
    .from("tournaments")
    .update({ status: "active", rounds })
    .eq("id", tournamentId);

  revalidatePath(`/torneos/${tournamentId}`);
  return { ok: true };
}

// ---------- Resultados (misma regla que ligas: reportar + confirmar) ----------

async function closeMatch(
  tournamentId: string,
  matchId: string,
  home: number,
  away: number,
  reportedBy: string,
  status: "pending_confirm" | "played"
): Promise<TResult> {
  if (home === away)
    return { error: "En eliminatoria no hay empates — decidan el desempate." };
  const admin = createAdminClient();
  const winnerId =
    home > away
      ? (
          await admin
            .from("tournament_matches")
            .select("home_user_id")
            .eq("id", matchId)
            .single()
        ).data?.home_user_id
      : (
          await admin
            .from("tournament_matches")
            .select("away_user_id")
            .eq("id", matchId)
            .single()
        ).data?.away_user_id;

  await admin
    .from("tournament_matches")
    .update({
      home_score: home,
      away_score: away,
      reported_by: reportedBy,
      status,
      ...(status === "played" ? { winner_id: winnerId } : {}),
    })
    .eq("id", matchId);

  if (status === "played" && winnerId) {
    const { data: m } = await admin
      .from("tournament_matches")
      .select("round, slot")
      .eq("id", matchId)
      .single();
    const { data: t } = await admin
      .from("tournaments")
      .select("rounds")
      .eq("id", tournamentId)
      .single();
    if (m && t) await advanceWinner(admin, tournamentId, m.round, m.slot, winnerId, t.rounds);
  }
  revalidatePath(`/torneos/${tournamentId}`);
  return { ok: true };
}

/** Participante reporta el marcador — queda pendiente de confirmación. */
export async function reportTournamentScore(
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<TResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };
  if (homeScore < 0 || awayScore < 0) return { error: "Marcador inválido." };

  const { data: m } = await supabase
    .from("tournament_matches")
    .select("tournament_id, home_user_id, away_user_id, status")
    .eq("id", matchId)
    .single();
  if (!m || (m.home_user_id !== user.id && m.away_user_id !== user.id))
    return { error: "No juegas este partido." };
  if (m.status === "played" || m.status === "cancelled")
    return { error: "Este partido ya está cerrado." };

  return closeMatch(
    m.tournament_id,
    matchId,
    homeScore,
    awayScore,
    user.id,
    "pending_confirm"
  );
}

/** El otro participante confirma — el ganador avanza de ronda. */
export async function confirmTournamentScore(matchId: string): Promise<TResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data: m } = await supabase
    .from("tournament_matches")
    .select(
      "tournament_id, home_user_id, away_user_id, status, reported_by, home_score, away_score"
    )
    .eq("id", matchId)
    .single();
  if (!m || m.status !== "pending_confirm" || m.reported_by === user.id)
    return { error: "Nada que confirmar." };
  if (m.home_user_id !== user.id && m.away_user_id !== user.id)
    return { error: "No juegas este partido." };

  return closeMatch(
    m.tournament_id,
    matchId,
    m.home_score ?? 0,
    m.away_score ?? 0,
    m.reported_by ?? user.id,
    "played"
  );
}

/** El organizador fija el marcador directamente (disputas). */
export async function ownerSetTournamentScore(
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<TResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data: m } = await supabase
    .from("tournament_matches")
    .select("tournament_id, status, tournament:tournaments(created_by)")
    .eq("id", matchId)
    .single();
  const t = m?.tournament as unknown as { created_by: string } | null;
  if (!m || t?.created_by !== user.id)
    return { error: "Solo el organizador." };
  if (m.status === "played") return { error: "Ya está cerrado." };

  return closeMatch(
    m.tournament_id,
    matchId,
    homeScore,
    awayScore,
    user.id,
    "played"
  );
}

/** WO: el organizador da la victoria al que se presentó. */
export async function awardTournamentWin(
  matchId: string,
  winnerId: string
): Promise<TResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data: m } = await supabase
    .from("tournament_matches")
    .select(
      "tournament_id, home_user_id, away_user_id, status, tournament:tournaments(created_by)"
    )
    .eq("id", matchId)
    .single();
  const t = m?.tournament as unknown as { created_by: string } | null;
  if (!m || t?.created_by !== user.id) return { error: "Solo el organizador." };
  if (m.status === "played") return { error: "Ya está cerrado." };

  const homeWon = winnerId === m.home_user_id;
  const awayWon = winnerId === m.away_user_id;
  if (!homeWon && !awayWon) return { error: "Ese jugador no está en este partido." };

  return closeMatch(m.tournament_id, matchId, homeWon ? 3 : 0, awayWon ? 3 : 0, user.id, "played");
}
