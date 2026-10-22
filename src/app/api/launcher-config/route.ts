import { NextResponse } from "next/server";

/**
 * Lista pública de servidores de juego conocidos.
 * El launcher la consume con «Actualizar servidores» para recibir
 * presets nuevos sin descargar una versión nueva.
 *
 * IMPORTANTE: solo añadir entradas verificadas en producción.
 */
const SERVERS = [
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

export function GET() {
  return NextResponse.json(
    { version: 1, servers: SERVERS },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
