import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  let players: Profile[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .gt("matches_played", 0)
      .order("wins", { ascending: false })
      .limit(50);
    players = (data as Profile[]) ?? [];
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
        <span className="text-gold">Ranking</span>
      </h1>

      <div className="mt-4 rounded-lg border border-gold/30 bg-gold/5 p-4 text-sm text-neutral-400">
        <strong className="text-gold">Clasificación no competitiva todavía:</strong>{" "}
        el ranking solo mostrará partidos verificados por el servidor. Los
        resultados reportados por clientes no cuentan para evitar trampas.
      </div>

      {players.length === 0 ? (
        <div className="mt-8 rounded-lg border border-carbon-700 bg-carbon-800 p-8 text-center text-neutral-500 uppercase tracking-wider">
          Sin partidos verificados todavía
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-carbon-700">
        <table className="w-full text-left">
          <thead className="bg-carbon-800 text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Jugador</th>
              <th className="px-4 py-3 text-center">PJ</th>
              <th className="px-4 py-3 text-center">V</th>
              <th className="px-4 py-3 text-center">E</th>
              <th className="px-4 py-3 text-center">D</th>
              <th className="px-4 py-3 text-center">%V</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr
                key={p.id}
                className="border-t border-carbon-700 bg-carbon-900"
              >
                <td className="scoreboard px-4 py-3 text-gold">{i + 1}</td>
                <td className="px-4 py-3 font-semibold uppercase">
                  {p.username}
                </td>
                <td className="scoreboard px-4 py-3 text-center">
                  {p.matches_played}
                </td>
                <td className="scoreboard px-4 py-3 text-center text-pitch-light">
                  {p.wins}
                </td>
                <td className="scoreboard px-4 py-3 text-center">{p.draws}</td>
                <td className="scoreboard px-4 py-3 text-center text-red-400">
                  {p.losses}
                </td>
                <td className="scoreboard px-4 py-3 text-center">
                  {Math.round((p.wins / p.matches_played) * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
