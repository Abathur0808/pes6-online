# Viabilidad técnica — PES 6 Online

**Fecha:** 2026-10-21 · **Estado:** investigación inicial completada

## Resumen ejecutivo

**PES 6 no puede ejecutarse en un navegador.** Es un binario x86 de Windows (DirectX 9, 2006); no existe port de código abierto, ni emulador WASM con rendimiento jugable, ni reimplementación legal del ejecutable. Cualquier afirmación contraria no está verificada.

La vía real y probada —usada hoy por comunidades activas (pes6.es, pes6j)— es:

1. El jugador instala su propia copia de **PES 6 para PC**.
2. Un **servidor de comunidad** (implementación open source del protocolo original: **fiveserver**, `github.com/juce/fiveserver`, Python) sustituye a los extintos servidores de Konami.
3. El juego llega a ese servidor por redirección DNS (archivo `hosts` o `network.cfg` del módulo Network de **Kitserver**, `github.com/kitserver/kitserver6`):
   - `pes6gate-ec.winning-eleven.net` → servidor de login/lobby.
   - `we9stun.winning-eleven.net` → servidor **STUN (RFC 3489)** para NAT traversal.
4. El partido real es **P2P por UDP** (puertos ~5730–5739) entre ambos jugadores; el servidor solo coordina.

**Conclusión:** nuestra plataforma web es la capa de comunidad (auth, perfiles, salas, ranking) y el juego se ejecuta fuera del navegador. La integración real exige operar (o federarse con) un servidor tipo fiveserver, que **no puede vivir en Vercel** (necesita proceso persistente + UDP/TCP no-HTTP + STUN).

## Comparativa de alternativas

| # | Alternativa | Software extra del jugador | ¿Navegador? | Conexión | Latencia | Complejidad | Riesgo legal | Costes | Compatible Vercel |
|---|-------------|---------------------------|-------------|----------|----------|-------------|--------------|--------|-------------------|
| 1 | **Cliente PC + fiveserver propio** | PES 6 + Kitserver/hosts | No (cliente nativo) | Gate TCP + STUN + P2P UDP | Baja (P2P directo, ~20-80 ms según distancia/NAT) | Media (fiveserver ya implementa el protocolo) | Baja si no distribuimos el juego; el protocolo es reimplementación comunitaria de ~15 años | VPS pequeño (~$5/mes) para gate+STUN | Parcial: web sí; game server NO (fuera de Vercel) |
| 2 | **Cliente PC + servidor comunitario existente** (pes6.es, pes6j) | PES 6 + hosts de su server | No | Igual que #1, hacia su infra | Baja | Muy baja (cero backend propio) | Dependemos de terceros; cuentas/rankings en su sistema | $0 | Sí (la web solo coordina) |
| 3 | **Emulación/ejecución en navegador** | Ninguno | Hipotéticamente sí | — | — | **Inviable**: no existe port WASM ni reimplementación de PES 6; ports de emuladores x86 completos (v86) no alcanzan rendimiento jugable con DirectX 9 | Distribuir el binario = infracción de copyright | — | No aplica |
| 4 | **Cliente/launcher propio** | Nuestro launcher + PES 6 | No | El launcher escribe hosts/network.cfg y reporta resultados | Baja | Alta (app de escritorio, firma, distribución, permisos admin para `hosts`) | Igual que #1 | VPS + CI del launcher | Backend en VPS; web en Vercel |
| 5 | **VPN virtual (Hamachi/Radmin)** | PES 6 + cliente VPN | No | P2P sobre LAN virtual | Media (sobrecoste VPN) | Baja, pero fricción alta para usuarios | Baja | Servidor VPN o SaaS | La web solo coordina |

### Detalle por alternativa

**#1 — Cliente PC + fiveserver propio (recomendada)**
- El jugador instala PES 6 (su copia), aplica hosts o `network.cfg` apuntando a nuestro gate+STUN.
- fiveserver gestiona autenticación in-game (el juego pide `usuario-password`), lobby y matchmaking. El partido fluye P2P UDP; el servidor no reenvía tráfico de juego (no hay relay salvo fallback).
- NAT simétrico/CGNAT puede impedir P2P → la comunidad lo resuelve con STUN propio y, en último caso, VPN virtual. Latencia típica P2P: 20–80 ms entre peers cercanos; no hay tick rate de servidor porque el estado lo sincronizan los propios clientes (lockstep del juego original).
- fiveserver usa MySQL; despliegue en VPS contenedorizado. **Nuestro trabajo**: mapear cuentas Supabase ↔ cuentas de juego (serial/username) y leer resultados reportados por el gate para `match_results` (validación servidor-side, no cliente).
- Es la única opción que da partidas reales **verificables** y rankings no falsificables.

**#2 — Servidor comunitario existente**
- Máximo pragmatismo: nuestra web coordina salas y enlaza a pes6.es para el juego real. Cero backend de juego propio. Pero cuentas, resultados y rankings viven fuera → no podemos verificar ni puntuar. Buena como *modo interim* documentado, no como producto final.

**#3 — Navegador**
- Descartada con evidencia: no hay port, ni emulador viable, y distribuir ISO/binarios es ilegal. EmulatorJS/similares cubren consolas retro (PS1 como mucho jugable), no un título PC DirectX 9. No se vuelve a evaluar salvo que aparezca una reimplementación open source real.

**#4 — Launcher propio**
- Un ejecutable ligero que: escribe `hosts`/`network.cfg` → lanza `pes6.exe` → (futuro) login con nuestra cuenta y reporte de resultados desde nuestro gate. Es la evolución natural de #1 para UX de "un clic".
- **Estado: primera versión implementada** en `launcher/` (PowerShell + WPF, cero dependencias): detecta el exe en `D:\Games\pech\PECH CLASSIC PATCH`, escribe un bloque reversible en `hosts`, hace `flushdns` y lanza el juego. Pendiente: firma de código, login integrado y soporte `network.cfg` de Kitserver.

**#5 — VPN virtual**
- Solución clásica pre-fiveserver. Hoy es redundante (fiveserver ya resuelve NAT con STUN) salvo para CGNAT estricto. Documentada como fallback.

## Arquitectura elegida

```
┌──────────────────────────────┐        ┌─────────────────────────────┐
│  Vercel — Next.js            │        │  VPS — Game backend           │
│  Web: auth, perfiles, salas, │  HTTPS │  fiveserver (gate TCP)        │
│  ranking, torneos            │◄──────►│  STUN RFC 3489 (UDP)          │
│  Supabase (Postgres+Realtime)│ results│  → reporta match_results      │
└──────────────▲───────────────┘        └──────────────▲──────────────┘
               │ WebRTC/Realtime                        │ hosts/network.cfg
        Navegadores (coordinación)                  pes6.exe × 2 (P2P UDP)
```

- **Coordinación y comunidad:** Next.js + Supabase (auth, Postgres, RLS, Realtime para salas y signaling de la PoC).
- **Partidas reales:** fases → (a) interim con servidor comunitario documentado; (b) fiveserver propio en VPS; (c) launcher opcional.
- **Resultados:** solo se consideran verificados los que reporte el game backend (`match_results.verified`), nunca el cliente. `verified=false` = amistoso reportado, no puntúa ranking.

## PoC construida (`/conectividad`)

WebRTC DataChannel entre dos navegadores con signaling por Supabase Realtime.

- **Demuestra:** handshake SDP/ICE, NAT traversal STUN, canal bidireccional P2P, cierre limpio — el mismo *shape* de conectividad que usa el juego (gate/STUN → P2P UDP).
- **NO demuestra:** que PES 6 corra en navegador ni que su protocolo hable WebRTC. El protocolo del juego es propietario UDP; la PoC valida nuestra capa de coordinación y signaling, no el juego.

## Riesgos y bloqueos abiertos

- **[Bloqueante para partidas reales]** Desplegar fiveserver + STUN en VPS y mapear cuentas Supabase↔juego.
- **CGNAT/NAT simétrico** puede impedir P2P a algunos usuarios (fallback documentado: VPN o relay; el juego original no tiene TURN).
- **Reporte de resultados**: fiveserver registra resultados en su DB (MySQL); hay que extraerlos/puente hacia Supabase (worker que lee y escribe `match_results.verified`).
- **Legal**: nunca distribuir binario/ISO/parches con copyright; enlazar a fuentes del usuario.
- **hosts file** requiere admin en Windows → fricción de onboarding; mitigable con Kitserver `network.cfg` o launcher (#4).

## Fuentes verificadas

- `github.com/juce/fiveserver` — implementación open source del servidor (gate, lobby, rooms).
- `github.com/kitserver/kitserver6` + manual Kitserver — módulo Network, `network.cfg`, STUN configurable.
- pes6.es / evo-web — procedimiento real de conexión (hosts → pes6gate + we9stun), comunidad activa (~1500 partidos/día reportados).
- Issues de fiveserver (#29) — confirman: gate/lobby sin STUN integrado; match traffic P2P UDP 5730–5739.
