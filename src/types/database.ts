/** Estados explícitos del ciclo de vida de una sala. */
export type RoomStatus =
  | "waiting" // esperando jugadores
  | "full" // completa, lista para conectar
  | "connecting" // jugadores estableciendo conexión
  | "in_game" // partido en curso (motor externo)
  | "finished"; // finalizada

export type RoomRole = "host" | "guest";

/** Modo de juego de la sala.
 * - "1v1": duelo clásico (default)
 * - "coop": varios jugadores en el mismo PC (mandos extra) vs rival online
 * - "clan": duelo de clanes — serie de 1v1 sumando puntos por equipo
 * El netcode de PES 6 online es estrictamente 1v1: los modos por equipos
 * se coordinan desde la web y se juegan como 1v1 o co-op local. */
export type RoomMode = "1v1" | "coop" | "clan";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  /** true = foto retirada por reportes; no puede volver a subir. */
  avatar_banned?: boolean;
  created_at: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  status: RoomStatus;
  host_id: string;
  /** Aforo de la sala (2-8). */
  max_players?: number;
  match_settings: {
    match_length?: number;
    difficulty?: string;
    conditions?: string;
    /** Parche/roster requerido — ambos jugadores deben tener el mismo. */
    patch?: string;
    /** Modo de juego (por defecto "1v1"). */
    mode?: RoomMode;
    /** Servidor de red acordado para el partido (nombre del preset). */
    server?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  room_id: string;
  user_id: string;
  role: RoomRole;
  ready: boolean;
  joined_at: string;
  profile?: Profile;
}

export interface RoomMessage {
  id: number;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  requester?: Profile;
  addressee?: Profile;
}

export interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  room_id: string | null;
  created_at: string;
  challenger?: Profile;
  challenged?: Profile;
}

export type CommendTag = "fair_play" | "good_game" | "punctual";

export interface Commend {
  room_id: string;
  from_id: string;
  to_id: string;
  tag: CommendTag;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  kind: "club" | "national" | "classic";
  era: string | null;
  crest_url: string | null;
  is_demo: boolean;
}

export type LeagueStatus = "draft" | "active" | "finished";
export type LeagueMatchStatus =
  | "scheduled"
  | "pending_confirm"
  | "played"
  | "cancelled";

export interface League {
  id: string;
  name: string;
  description: string | null;
  status: LeagueStatus;
  created_by: string;
  created_at: string;
  /** Aforo de inscritos (al llenarse se deriva a la división inferior). */
  max_members?: number;
  /** 1 = primera división, 2 = ascenso, etc. */
  division?: number;
  /** Liga de la que esta es división inferior (null = primera división). */
  parent_league_id?: string | null;
  /** Plazas que ascienden/descienden al terminar (0 = sin ascensos). */
  relegation_size?: number;
  /** true si ya se aplicó el intercambio de ascenso/descenso. */
  swapped?: boolean;
}

export interface LeagueMember {
  league_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export interface LeagueMatch {
  id: string;
  league_id: string;
  matchday: number;
  home_user_id: string;
  away_user_id: string;
  home_score: number | null;
  away_score: number | null;
  status: LeagueMatchStatus;
  reported_by: string | null;
  /** Fecha/hora pactada para jugar (null = sin acordar). */
  scheduled_at?: string | null;
  /** Captura del resultado subida como prueba. */
  proof_url?: string | null;
  home?: Profile;
  away?: Profile;
}

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  status: LeagueStatus;
  created_by: string;
  winner_id: string | null;
  rounds: number;
  created_at: string;
  winner?: Profile;
}

export interface TournamentMember {
  tournament_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  slot: number;
  home_user_id: string | null;
  away_user_id: string | null;
  home_score: number | null;
  away_score: number | null;
  winner_id: string | null;
  status: LeagueMatchStatus;
  reported_by: string | null;
  scheduled_at?: string | null;
  proof_url?: string | null;
  home?: Profile | null;
  away?: Profile | null;
}

export interface Match {
  id: string;
  room_id: string | null;
  home_user_id: string;
  away_user_id: string;
  played_at: string | null;
  status: "scheduled" | "in_progress" | "finished" | "cancelled";
}

export interface MatchResult {
  match_id: string;
  home_score: number;
  away_score: number;
  reported_by: string;
  verified: boolean;
  created_at: string;
}
