/** Estados explícitos del ciclo de vida de una sala. */
export type RoomStatus =
  | "waiting" // esperando jugadores
  | "full" // completa, lista para conectar
  | "connecting" // jugadores estableciendo conexión
  | "in_game" // partido en curso (motor externo)
  | "finished"; // finalizada

export type RoomRole = "host" | "guest";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
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
  match_settings: {
    match_length?: number;
    difficulty?: string;
    conditions?: string;
    /** Parche/roster requerido — ambos jugadores deben tener el mismo. */
    patch?: string;
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

export interface Team {
  id: string;
  name: string;
  kind: "club" | "national" | "classic";
  era: string | null;
  crest_url: string | null;
  is_demo: boolean;
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
