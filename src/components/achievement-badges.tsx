/** Logros computados en vivo desde las stats reales — sin tabla propia,
 *  imposible de falsificar y siempre actualizados. */
export function AchievementBadges({
  matches,
  wins,
  commends,
}: {
  matches: number;
  wins: number;
  commends: number;
}) {
  const winrate = matches > 0 ? wins / matches : 0;
  const badges: { icon: string; name: string; desc: string; got: boolean }[] = [
    { icon: "⚽", name: "Debut", desc: "Juega tu primer partido", got: matches >= 1 },
    { icon: "🏆", name: "Primera sangre", desc: "Gana tu primer partido", got: wins >= 1 },
    { icon: "🎖️", name: "Veterano", desc: "10 partidos jugados", got: matches >= 10 },
    { icon: "👑", name: "Leyenda", desc: "50 partidos jugados", got: matches >= 50 },
    { icon: "🔥", name: "Dominador", desc: "+60% de victorias (min. 10 PJ)", got: matches >= 10 && winrate >= 0.6 },
    { icon: "⚡", name: "Ganador nato", desc: "10 victorias", got: wins >= 10 },
    { icon: "🤝", name: "Respetado", desc: "5 elogios de rivales", got: commends >= 5 },
  ];

  const earned = badges.filter((b) => b.got).length;

  return (
    <div className="rounded-lg border border-carbon-700 bg-carbon-800 p-5">
      <h2 className="font-sport text-sm font-semibold uppercase tracking-wider text-neutral-400">
        Logros <span className="text-gold">{earned}/{badges.length}</span>
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {badges.map((b) => (
          <div
            key={b.name}
            className={`rounded border p-3 text-center transition ${
              b.got
                ? "border-gold/50 bg-gold/10"
                : "border-carbon-700 bg-carbon-900 opacity-40"
            }`}
            title={b.desc}
          >
            <p className={`text-2xl ${b.got ? "" : "grayscale"}`}>{b.icon}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-neutral-300">
              {b.name}
            </p>
            <p className="text-[10px] text-neutral-500">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
