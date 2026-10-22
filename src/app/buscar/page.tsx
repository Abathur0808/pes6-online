import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MatchmakingClient } from "@/components/matchmaking-client";

export const dynamic = "force-dynamic";

export default async function BuscarPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
        Buscar <span className="text-pitch">rival</span>
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Matchmaking instantáneo: entra a la cola y te emparejamos con el
        primer jugador disponible.
      </p>
      <MatchmakingClient />
    </div>
  );
}
