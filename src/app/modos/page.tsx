import Link from "next/link";

const modes = [
  {
    id: "1v1",
    title: "1v1 — Duelo clásico",
    desc: "El modo original de PES 6 online. Dos jugadores, un partido. Crea una sala, comparte el código y en cuanto ambos estéis listos, a jugar.",
    how: [
      "Cada jugador entra desde su propio PC y cuenta.",
      "La sala llena cuando entra el rival — la web os coordina.",
      "El partido se juega en el cliente de PES 6 conectado al servidor.",
    ],
    accent: "text-pitch-light",
    border: "hover:border-pitch",
  },
  {
    id: "coop",
    title: "Co-op — Varios en un mismo PC",
    desc: "PES 6 permite conectar varios mandos en el mismo PC y jugar todos del mismo lado. Tu equipo local (2, 3 o hasta 4 jugadores en el sofá) se enfrenta al rival online en un partido 1v1.",
    how: [
      "Conecta los mandos extra antes de lanzar PES 6.",
      "En el juego, configura ambos mandos para el mismo equipo.",
      "En la web solo hace falta una cuenta: la sala sigue siendo 1v1 — tu equipo local juega unido.",
      "Ideal para tardes de fútbol con amigos contra gente de la comunidad.",
    ],
    accent: "text-sky-300",
    border: "hover:border-sky-400",
  },
  {
    id: "clan",
    title: "Duelo de clanes — Serie por equipos",
    desc: "El modo de guerra de clanes: cada equipo presenta varios jugadores y se juega una serie de partidos 1v1. Cada victoria suma un punto para el clan — gana el equipo con más puntos.",
    how: [
      "Acordad entre capitanes: número de partidos (ej. 3v3, 5v5) y el orden de los jugadores.",
      "Cada enfrentamiento es una sala 1v1 normal con su código.",
      "Anotad los resultados y sumad puntos — la gestión de puntuación automática llegará con la sección de clanes.",
      "Próximamente: registro de clanes, emparejamiento y marcador agregado en la web.",
    ],
    accent: "text-gold",
    border: "hover:border-gold",
  },
];

export default function ModosPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
        Modos de <span className="text-pitch">juego</span>
      </h1>
      <p className="mt-3 max-w-3xl text-neutral-400">
        El netcode de PES 6 online es técnicamente 1v1, pero hay tres formas
        reales de competir — incluidas dos pensadas para jugar en equipo.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {modes.map((m) => (
          <section
            key={m.id}
            className={`rounded-lg border border-carbon-700 bg-carbon-800 p-6 transition ${m.border}`}
          >
            <h2
              className={`font-sport text-xl font-semibold uppercase tracking-wide ${m.accent}`}
            >
              {m.title}
            </h2>
            <p className="mt-3 text-sm text-neutral-400">{m.desc}</p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-500">
              {m.how.map((step) => (
                <li key={step} className="flex gap-2">
                  <span className={`${m.accent} select-none`}>▸</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-carbon-700 bg-carbon-800 p-6 text-center">
        <p className="text-neutral-400">
          Al crear una sala eliges el modo — queda visible en el listado para
          que el rival sepa a qué se apunta.
        </p>
        <Link
          href="/salas/nueva"
          className="mt-4 inline-block rounded bg-pitch px-8 py-3 font-sport font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-pitch-light"
        >
          Crear sala
        </Link>
      </div>
    </div>
  );
}
