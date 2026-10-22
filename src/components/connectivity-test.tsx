"use client";

import { useRef, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type LogLine = { t: string; msg: string };

const STUN_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

/**
 * PoC de conectividad P2P:
 * - Supabase Realtime (broadcast) actúa como canal de signaling.
 * - WebRTC DataChannel demuestra conexión directa entre dos peers.
 * Lo que demuestra: handshake SDP/ICE, NAT traversal, mensajes bidireccionales.
 * Lo que NO demuestra: ejecución de PES 6 (eso requiere el cliente de PC).
 */
export function ConnectivityTest() {
  const [sessionCode, setSessionCode] = useState("");
  const [role, setRole] = useState<"idle" | "host" | "guest">("idle");
  const [connected, setConnected] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);
  const [message, setMessage] = useState("");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  function addLog(msg: string) {
    setLog((l) => [...l.slice(-50), { t: new Date().toLocaleTimeString(), msg }]);
  }

  function setupPeer(code: string, isHost: boolean) {
    const supabase = createClient();
    const channel = supabase.channel(`rtc:${code}`);

    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        channel.send({
          type: "broadcast",
          event: "ice",
          payload: { candidate: e.candidate.toJSON() },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      addLog(`ICE/peer state: ${pc.connectionState}`);
      if (pc.connectionState === "connected") setConnected(true);
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setConnected(false);
      }
    };

    function bindDataChannel(dc: RTCDataChannel) {
      dcRef.current = dc;
      dc.onopen = () => addLog("DataChannel abierto — P2P establecido");
      dc.onmessage = (e) => addLog(`← ${e.data}`);
      dc.onclose = () => addLog("DataChannel cerrado");
    }

    channel
      .on("broadcast", { event: "offer" }, async ({ payload }) => {
        if (isHost) return;
        addLog("Oferta recibida");
        await pc.setRemoteDescription(payload.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.send({
          type: "broadcast",
          event: "answer",
          payload: { sdp: answer },
        });
      })
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (!isHost) return;
        addLog("Respuesta recibida");
        await pc.setRemoteDescription(payload.sdp);
      })
      .on("broadcast", { event: "ice" }, async ({ payload }) => {
        try {
          await pc.addIceCandidate(payload.candidate);
        } catch (err) {
          addLog(`ICE error: ${String(err)}`);
        }
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        addLog(`Canal de signaling suscrito (${code})`);

        if (isHost) {
          const dc = pc.createDataChannel("pes6-poc");
          bindDataChannel(dc);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({
            type: "broadcast",
            event: "offer",
            payload: { sdp: offer },
          });
          addLog("Oferta enviada");
        } else {
          pc.ondatachannel = (e) => bindDataChannel(e.channel);
        }
      });
  }

  function start(asHost: boolean) {
    const code = sessionCode.trim().toUpperCase();
    if (!code) return;
    setRole(asHost ? "host" : "guest");
    setupPeer(code, asHost);
  }

  function send() {
    if (!dcRef.current || !message) return;
    dcRef.current.send(message);
    addLog(`→ ${message}`);
    setMessage("");
  }

  function close() {
    dcRef.current?.close();
    pcRef.current?.close();
    pcRef.current = null;
    dcRef.current = null;
    setConnected(false);
    setRole("idle");
    addLog("Conexión cerrada");
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-lg border border-gold/30 bg-gold/5 p-6 text-neutral-400">
        La prueba necesita Supabase Realtime: configura las variables de
        entorno (ver <code>.env.example</code>).
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-carbon-700 bg-carbon-800 p-4">
        <input
          value={sessionCode}
          onChange={(e) => setSessionCode(e.target.value)}
          placeholder="Código de sesión (ej. TEST01)"
          disabled={role !== "idle"}
          className="scoreboard rounded border border-carbon-600 bg-carbon-900 px-3 py-2 uppercase text-pitch-light outline-none focus:border-pitch disabled:opacity-50"
        />
        {role === "idle" ? (
          <>
            <button
              onClick={() => start(true)}
              className="rounded bg-pitch px-4 py-2 text-sm font-bold uppercase tracking-wider text-carbon-950 hover:bg-pitch-light"
            >
              Crear como host
            </button>
            <button
              onClick={() => start(false)}
              className="rounded border border-pitch px-4 py-2 text-sm font-semibold uppercase tracking-wider text-pitch-light hover:bg-pitch hover:text-carbon-950"
            >
              Unirse como rival
            </button>
          </>
        ) : (
          <button
            onClick={close}
            className="rounded border border-red-800 px-4 py-2 text-sm uppercase tracking-wider text-red-400 hover:bg-red-950"
          >
            Cerrar conexión
          </button>
        )}
        <span
          className={`ml-auto rounded-full px-3 py-1 text-xs uppercase tracking-wider ${
            connected
              ? "bg-pitch/20 text-pitch-light"
              : "bg-carbon-700 text-neutral-500"
          }`}
        >
          {connected ? "P2P conectado" : role === "idle" ? "Inactivo" : "Conectando…"}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Mensaje de prueba"
          disabled={!connected}
          className="flex-1 rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-neutral-200 outline-none focus:border-pitch disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={!connected}
          className="rounded bg-pitch px-4 py-2 text-sm font-bold uppercase text-carbon-950 hover:bg-pitch-light disabled:opacity-50"
        >
          Enviar
        </button>
      </div>

      <div className="h-56 overflow-y-auto rounded-lg border border-carbon-700 bg-carbon-900 p-4 font-mono text-xs text-neutral-400">
        {log.length === 0 ? (
          <p className="text-neutral-600">
            {"// El registro de conexión aparecerá aquí"}
          </p>
        ) : (
          log.map((l, i) => (
            <p key={i}>
              <span className="text-neutral-600">[{l.t}]</span> {l.msg}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
