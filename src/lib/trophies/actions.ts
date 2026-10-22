"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { computeStandings } from "@/lib/leagues/actions";

export interface Trophy {
  kind: "league" | "tournament";
  name: string;
  description: string | null;
  /** División de liga (null en torneos). */
  division?: number;
  href: string;
}

/**
 * Vitrina de trofeos de un jugador:
 * - Torneos terminados con winner_id = jugador.
 * - Ligas terminadas donde fue miembro y quedó 1º en la tabla.
 */
export async function getTrophies(userId: string): Promise<Trophy[]> {
  const admin = createAdminClient();
  const trophies: Trophy[] = [];

  // Torneos ganados (consulta directa por winner_id).
  const { data: wonTournaments } = await admin
    .from("tournaments")
    .select("id, name, description, created_at")
    .eq("winner_id", userId)
    .order("created_at", { ascending: false });
  for (const t of wonTournaments ?? []) {
    trophies.push({
      kind: "tournament",
      name: t.name,
      description: t.description,
      href: `/torneos/${t.id}`,
    });
  }

  // Ligas terminadas donde fue miembro → ver si quedó 1º.
  const { data: memberships } = await admin
    .from("league_members")
    .select(
      "league_id, league:leagues!inner(name, description, division, status)"
    )
    .eq("user_id", userId);
  for (const m of memberships ?? []) {
    const league = m.league as unknown as {
      name: string;
      description: string | null;
      division: number;
      status: string;
    } | null;
    if (!league || league.status !== "finished") continue;
    const table = await computeStandings(admin, m.league_id);
    if (table[0] === userId) {
      trophies.push({
        kind: "league",
        name: league.name,
        description: league.description,
        division: league.division,
        href: `/ligas/${m.league_id}`,
      });
    }
  }

  return trophies;
}
