"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const OnlineCtx = createContext<Set<string>>(new Set());

/**
 * Presencia global: un canal de Realtime donde cada usuario conectado
 * publica su id. Cualquier componente puede consultar useOnline().
 */
export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase.channel("pes6-presence", {
        config: { presence: { key: user.id } },
      });
      channel
        .on("presence", { event: "sync" }, () => {
          setOnline(new Set(Object.keys(channel.presenceState())));
        })
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ user_id: user.id });
          }
        });
    });

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  return <OnlineCtx.Provider value={online}>{children}</OnlineCtx.Provider>;
}

export function useOnline() {
  return useContext(OnlineCtx);
}

/** Punto verde si el usuario está conectado ahora mismo. */
export function OnlineDot({ userId }: { userId?: string }) {
  const online = useOnline();
  if (!userId || !online.has(userId)) return null;
  return (
    <span
      className="inline-block h-2 w-2 rounded-full bg-pitch align-middle"
      title="En línea ahora"
    />
  );
}
