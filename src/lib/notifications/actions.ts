"use server";

import { createClient } from "@/lib/supabase/server";

/** Una notificación agregada — se genera en tiempo real, sin tabla propia. */
export interface AppNotification {
  kind: "friend_request" | "confirm_score" | "league_match" | "commend";
  /** Texto corto para listar. */
  text: string;
  /** Detalle secundario (liga, fecha, tipo de elogio…). */
  detail?: string;
  /** A dónde lleva el clic. */
  href: string;
}

export interface NotificationsResult {
  items: AppNotification[];
  count: number;
}

const TAG_LABEL: Record<string, string> = {
  fair_play: "juego limpio",
  good_game: "buen partido",
  punctual: "puntualidad",
};

/**
 * Centro de notificaciones agregado: junta en una sola consulta las cosas
 * que requieren tu atención. Sin tabla ni cron — siempre refleja el estado
 * real (una solicitud aceptada desaparece sola).
 */
export async function getNotifications(): Promise<NotificationsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], count: 0 };

  const [reqRes, confirmRes, matchRes, commendRes] = await Promise.all([
    // Solicitudes de amistad pendientes hacia mí.
    supabase
      .from("friendships")
      .select("id, requester:profiles!friendships_requester_id_fkey(username)")
      .eq("addressee_id", user.id)
      .eq("status", "pending"),

    // Marcadores de liga reportados que yo debo confirmar.
    supabase
      .from("league_matches")
      .select(
        "id, league_id, matchday, home_user_id, away_user_id, home:profiles!league_matches_home_user_id_fkey(username), away:profiles!league_matches_away_user_id_fkey(username), league:leagues(name)"
      )
      .eq("status", "pending_confirm")
      .neq("reported_by", user.id)
      .or(`home_user_id.eq.${user.id},away_user_id.eq.${user.id}`),

    // Mis partidos de liga pendientes (agendados o sin fecha).
    supabase
      .from("league_matches")
      .select(
        "id, league_id, matchday, scheduled_at, home_user_id, home:profiles!league_matches_home_user_id_fkey(username), away:profiles!league_matches_away_user_id_fkey(username), league:leagues(name)"
      )
      .eq("status", "scheduled")
      .or(`home_user_id.eq.${user.id},away_user_id.eq.${user.id}`)
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .limit(10),

    // Elogios recibidos recientemente.
    supabase
      .from("commends")
      .select("tag, created_at, from:profiles!commends_from_id_fkey(id, username)")
      .eq("to_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const items: AppNotification[] = [];

  for (const f of reqRes.data ?? []) {
    const name =
      (f.requester as unknown as { username: string } | null)?.username ??
      "Alguien";
    items.push({
      kind: "friend_request",
      text: `${name} te envió solicitud de amistad`,
      href: "/amigos",
    });
  }

  for (const m of confirmRes.data ?? []) {
    const league =
      (m.league as unknown as { name: string } | null)?.name ?? "Liga";
    const iAmHome = m.home_user_id === user.id;
    const rival = (
      (iAmHome ? m.away : m.home) as unknown as { username: string } | null
    )?.username;
    items.push({
      kind: "confirm_score",
      text: `Confirma el marcador reportado por ${rival ?? "tu rival"}`,
      detail: `${league} · Jornada ${m.matchday}`,
      href: `/ligas/${m.league_id}`,
    });
  }

  for (const m of matchRes.data ?? []) {
    const league =
      (m.league as unknown as { name: string } | null)?.name ?? "Liga";
    const iAmHome = m.home_user_id === user.id;
    const rival = (
      (iAmHome ? m.away : m.home) as unknown as { username: string } | null
    )?.username;
    items.push({
      kind: "league_match",
      text: `Partido pendiente contra ${rival ?? "tu rival"}`,
      detail:
        `${league} · Jornada ${m.matchday}` +
        (m.scheduled_at
          ? ` · ${new Date(m.scheduled_at).toLocaleString("es", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}`
          : " · sin fecha pactada"),
      href: `/ligas/${m.league_id}`,
    });
  }

  for (const c of commendRes.data ?? []) {
    const from = c.from as unknown as { id: string; username: string } | null;
    items.push({
      kind: "commend",
      text: `${from?.username ?? "Alguien"} te elogió por ${
        TAG_LABEL[c.tag] ?? c.tag
      }`,
      href: from ? `/amigos/${from.id}` : "/perfil",
    });
  }

  return { items, count: items.length };
}
