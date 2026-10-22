"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { leaveRoom, setReady, setRoomStatus } from "@/lib/rooms/actions";
import { ChatPanel } from "@/components/chat-panel";
import type { Room, RoomMember } from "@/types/database";

const STATUS_LABEL: Record<string, string> = {
  waiting: "Esperando jugadores",
  full: "Sala completa",
  connecting: "Conectando",
  in_game: "En partida",
  finished: "Finalizada",
};

const MODE_LABEL: Record<string, string> = {
  "1v1": "1v1",
  coop: "Co-op",
  clan: "Duelo de clanes",
};

export function RoomPanel({
  room,
  members: initialMembers,
  currentUserId,
}: {
  room: Room;
  members: RoomMember[];
  currentUserId: string | null;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [status, setStatus] = useState(room.status);

  const isMember = members.some((m) => m.user_id === currentUserId);
  const isHost = room.host_id === currentUserId;
  const me = members.find((m) => m.user_id === currentUserId);

  // Realtime: refrescar cuando cambian miembros o estado de la sala.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${room.id}`,
        },
        async () => {
          const { data } = await supabase
            .from("room_members")
            .select("*, profile:profiles(*)")
            .eq("room_id", room.id);
          if (data) setMembers(data as RoomMember[]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          setStatus((payload.new as Room).status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id]);

  const slots = [0, 1].map((i) => members[i] ?? null);

  return (
    <div className="space-y-6">
      {/* Slots de jugadores estilo marcador */}
      <div className="grid gap-4 md:grid-cols-2">
        {slots.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg border p-6 text-center ${
              m
                ? "border-pitch/50 bg-carbon-800"
                : "border-dashed border-carbon-600 bg-carbon-900/50"
            }`}
          >
            {m ? (
              <>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pitch font-sport text-xl font-bold text-carbon-950">
                  {(m.profile?.username ?? "?")[0].toUpperCase()}
                </div>
                <p className="mt-3 font-sport text-xl font-semibold uppercase">
                  {m.profile?.username ?? "Jugador"}
                </p>
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  {m.role === "host" ? "Anfitrión" : "Rival"}
                </p>
                <p
                  className={`mt-2 text-xs font-semibold uppercase tracking-wider ${
                    m.ready ? "text-pitch-light" : "text-gold"
                  }`}
                >
                  {m.ready ? "● Listo" : "○ Preparándose"}
                </p>
              </>
            ) : (
              <p className="py-6 text-sm uppercase tracking-wider text-neutral-600">
                Esperando jugador…
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Estado y condiciones */}
      <div className="rounded-lg border border-carbon-700 bg-carbon-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Estado
            </p>
            <p className="font-sport text-xl font-semibold uppercase text-pitch-light">
              {STATUS_LABEL[status]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Código de invitación
            </p>
          Modo:{" "}
          <span className="text-sky-300">
            {MODE_LABEL[room.match_settings?.mode ?? "1v1"]}
          </span>
          {" · "}  <p className="scoreboard font-sport text-2xl font-bold text-gold">
              {room.code}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-neutral-500">
          Duración: {room.match_settings?.match_length ?? 10} min
          {room.match_settings?.patch && (
            <>
              {" · Parche: "}
              <span className="text-gold">{room.match_settings.patch}</span>
            </>
          )}{" "}
          · El partido
          se juega con el cliente de PES 6 (ver{" "}
          <a href="/como-jugar" className="text-pitch-light underline">
            cómo jugar
          </a>
          ).
        </p>
      </div>

      {/* Aviso honesto */}
      <div className="rounded-lg border border-sky-400/30 bg-sky-400/5 p-4 text-sm text-neutral-400">
        <strong className="text-sky-300">Motor de juego no conectado:</strong>{" "}
        esta sala coordina jugadores y condiciones. El lanzamiento automático
        del partido está pendiente — ver documento de viabilidad técnica.
      </div>

      {/* Chat — aparece cuando la sala esta completa y eres miembro */}
      {isMember && members.length >= 2 && currentUserId && (
        <ChatPanel roomId={room.id} currentUserId={currentUserId} />
      )}

      {/* Acciones */}
      {isMember && (
        <div className="flex flex-wrap gap-3">
          <form action={setReady.bind(null, room.id, !me?.ready)}>
            <button className="rounded border border-pitch px-4 py-2 text-sm font-semibold uppercase tracking-wider text-pitch-light transition hover:bg-pitch hover:text-carbon-950">
              {me?.ready ? "No estoy listo" : "Estoy listo"}
            </button>
          </form>

          {isHost && status === "full" && (
            <form action={setRoomStatus.bind(null, room.id, "connecting")}>
              <button className="rounded bg-pitch px-4 py-2 text-sm font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-pitch-light">
                Iniciar conexión
              </button>
            </form>
          )}

          <form action={leaveRoom.bind(null, room.id)}>
            <button className="rounded border border-red-800 px-4 py-2 text-sm uppercase tracking-wider text-red-400 transition hover:bg-red-950">
              Salir de la sala
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
