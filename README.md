# PES 6 Online

Plataforma web comunitaria para jugar **Pro Evolution Soccer 6** online: perfiles, salas 1v1, equipos clásicos, ranking y torneos.

> **Estado honesto:** la web coordina jugadores y partidas. El juego real se ejecuta con tu propia copia de PES 6 para PC conectada a un servidor de red compatible (ver [`docs/technical-feasibility.md`](docs/technical-feasibility.md)). No distribuimos el juego ni contenido con copyright.

## Stack

- **Next.js 15** (App Router) · React 19 · TypeScript strict
- **Tailwind CSS** — estética fútbol retro PS2 (carbón + verde cancha)
- **Supabase** — Auth, PostgreSQL, RLS, Realtime (salas + signaling PoC)
- **Vercel** — despliegue del frontend

## Ejecutar en local

```bash
npm install
cp .env.example .env.local   # rellena tus claves de Supabase
npm run dev
```

La app funciona en **modo demo** sin Supabase (UI visible, sin cuentas ni salas reales).

## Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta [`supabase/schema.sql`](supabase/schema.sql) (tablas + RLS + triggers + Realtime).
3. Copia `Project URL` y `anon key` a `.env.local`.
4. (Opcional) `service_role key` solo para scripts servidor — nunca en el cliente.

## Despliegue en Vercel

```bash
npm run build   # verifica el build antes de subir
```

- Conecta el repo a Vercel y define las mismas env vars del `.env.example`.
- El game server (fiveserver + STUN) **no** va en Vercel: requiere VPS con proceso persistente y UDP — ver el documento de viabilidad.

## Estructura

```
src/
  app/            # páginas App Router (home, auth, salas, equipos, ranking, torneos, conectividad)
  components/     # navbar, auth-button, room-panel, connectivity-test…
  lib/            # supabase clients, server actions (auth, rooms)
  types/          # tipos del dominio
supabase/
  schema.sql      # esquema + RLS + triggers
launcher/         # launcher de escritorio (PowerShell + WPF): hosts + lanzar pes6.exe
docs/
  technical-feasibility.md
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Build de producción |
| `npm run typecheck` | TypeScript estricto sin emitir |
| `npm run lint` | ESLint |

## Seguridad

- RLS activo en todas las tablas; el cliente no puede editar estadísticas ni marcar resultados como verificados.
- Solo el backend de juego (service role) escribe `match_results.verified=true`.
- Sin secretos en el repo: `.env.local` está en `.gitignore`.
