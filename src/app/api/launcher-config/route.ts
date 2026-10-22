import { NextResponse } from "next/server";
import { SERVERS } from "@/lib/servers";

/**
 * Lista pública de servidores de juego conocidos.
 * El launcher la consume con «Actualizar servidores» para recibir
 * presets nuevos sin descargar una versión nueva.
 */

export function GET() {
  return NextResponse.json(
    { version: 1, servers: SERVERS },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
