/**
 * Servidores de juego conocidos — fuente unica de verdad.
 * La consume la API /api/launcher-config y la web (descarga de
 * launcher.config.json desde la sala).
 *
 * IMPORTANTE: solo añadir entradas verificadas en produccion.
 */
export interface ServerPreset {
  name: string;
  gateIp: string;
  stunIp: string;
  signupUrl: string;
  note: string;
}

export const GATE_HOST = "pes6gate-ec.winning-eleven.net";
export const STUN_HOST = "we9stun.winning-eleven.net";
export const LAUNCHER_SERVERS_URL =
  "https://onlinepech.vercel.app/api/launcher-config";

export const SERVERS: ServerPreset[] = [
  {
    name: "PES6Club",
    gateIp: "154.38.190.60",
    stunIp: "154.38.190.60",
    signupUrl: "https://pes6club.com/enroll",
    note: "Comunidad hispana activa. Requiere cuenta en pes6club.com y registrar el serial de tu PES 6.",
  },
  {
    name: "Personalizado",
    gateIp: "",
    stunIp: "",
    signupUrl: "",
    note: "Introduce las IPs de tu propio servidor (fiveserver/sixserver en un VPS).",
  },
];

/** Nombre por defecto cuando una sala no indica servidor. */
export const DEFAULT_SERVER = "PES6Club";
