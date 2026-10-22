"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, RoomMessage } from "@/types/database";

const MAX_LEN = 300;

export function ChatPanel({
  roomId,
  currentUserId,
}: {
  roomId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Carga inicial + suscripcion realtime.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase
      .from("room_messages")
      .select("*, profile:profiles(*)")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (!cancelled && data) setMessages(data as RoomMessage[]);
      });

    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // El evento realtime no trae el join — buscar el perfil aparte.
          const row = payload.new as RoomMessage;
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", row.user_id)
            .single();
          if (!cancelled) {
            setMessages((prev) =>
              prev.some((m) => m.id === row.id)
                ? prev
                : [...prev, { ...row, profile: (profile as Profile) ?? undefined }]
            );
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Auto-scroll al mensaje mas reciente.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.from("room_messages").insert({
      room_id: roomId,
      user_id: currentUserId,
      content,
    });

    if (err) setError("No se pudo enviar el mensaje.");
    else setText("");
    setSending(false);
  }

  return (
    <div className="rounded-lg border border-carbon-700 bg-carbon-800">
      <h3 className="border-b border-carbon-700 px-4 py-3 font-sport text-sm font-semibold uppercase tracking-wider text-pitch-light">
        Chat de sala
      </h3>

      <div className="h-56 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">
            Sin mensajes — poneos de acuerdo aqui.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.user_id === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                  {m.profile?.username ?? "Jugador"}
                </span>
                <span
                  className={`mt-0.5 max-w-[80%] break-words rounded px-3 py-1.5 text-sm ${
                    mine
                      ? "bg-pitch text-carbon-950"
                      : "bg-carbon-700 text-neutral-200"
                  }`}
                >
                  {m.content}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="flex gap-2 border-t border-carbon-700 px-3 py-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
          placeholder="Escribe un mensaje…"
          className="flex-1 rounded border border-carbon-600 bg-carbon-900 px-3 py-1.5 text-sm text-neutral-200 outline-none focus:border-pitch"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded bg-pitch px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-pitch-light disabled:opacity-50"
        >
          Enviar
        </button>
      </form>

      {error && (
        <p className="px-4 pb-3 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
