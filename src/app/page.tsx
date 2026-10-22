import Link from "next/link";
import { ServiceStatus } from "@/components/service-status";

const features = [
  {
    title: "Salas 1v1",
    desc: "Crea una sala, comparte el código y coordina el partido con tu rival.",
    href: "/salas",
    cta: "Ver salas",
  },
  {
    title: "Equipos clásicos",
    desc: "Catálogo de clubes y selecciones de la época dorada de PS2.",
    href: "/equipos",
    cta: "Explorar",
  },
  {
    title: "Ranking",
    desc: "Clasificación competitiva. Se activará cuando los resultados se validen en servidor.",
    href: "/ranking",
    cta: "Ver tabla",
  },
  {
    title: "Torneos",
    desc: "Brackets y ligas comunitarias. Arquitectura lista, competición próximamente.",
    href: "/torneos",
    cta: "Próximamente",
  },
];

export default function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="scanlines relative overflow-hidden border-b border-carbon-700 bg-gradient-to-b from-carbon-900 to-carbon-950 py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center">
          <ServiceStatus />

          <h1 className="font-sport text-5xl font-bold uppercase leading-tight tracking-wide md:text-7xl">
            Fútbol <span className="text-pitch">clásico</span>,
            <br />
            competición <span className="text-gold">real</span>
          </h1>

          <p className="max-w-2xl text-lg text-neutral-400">
            La comunidad de Pro Evolution Soccer 6. Crea tu cuenta, entra a una
            sala y juega partidos online con la leyenda de PlayStation 2.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/salas"
              className="rounded bg-pitch px-8 py-3 font-sport text-lg font-bold uppercase tracking-wider text-carbon-950 shadow-lg shadow-pitch/20 transition hover:bg-pitch-light"
            >
              Jugar ahora
            </Link>
            <Link
              href="/como-jugar"
              className="rounded border border-carbon-600 px-8 py-3 font-sport text-lg uppercase tracking-wider text-neutral-300 transition hover:border-pitch hover:text-pitch-light"
            >
              Cómo funciona
            </Link>
          </div>
        </div>
      </section>

      {/* Estado honesto del juego */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-lg border border-gold/30 bg-gold/5 p-6">
          <h2 className="font-sport text-xl font-semibold uppercase tracking-wide text-gold">
            Estado del motor de juego
          </h2>
          <p className="mt-2 text-neutral-400">
            Las salas ya coordinan jugadores, pero{" "}
            <strong className="text-neutral-200">
              el partido todavía se juega con tu propia copia de PES 6 para PC
            </strong>{" "}
            conectada a un servidor de red. Consulta{" "}
            <Link href="/como-jugar" className="text-pitch-light underline">
              cómo jugar
            </Link>{" "}
            y el{" "}
            <span className="text-neutral-300">
              documento de viabilidad técnica
            </span>{" "}
            para el detalle.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group rounded-lg border border-carbon-700 bg-carbon-800 p-6 transition hover:border-pitch"
            >
              <h3 className="font-sport text-xl font-semibold uppercase tracking-wide group-hover:text-pitch-light">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-400">{f.desc}</p>
              <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-wider text-pitch">
                {f.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Actividad reciente */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="font-sport text-2xl font-semibold uppercase tracking-wide">
          Actividad reciente
        </h2>
        <div className="mt-4 rounded-lg border border-carbon-700 bg-carbon-800 p-8 text-center text-neutral-500">
          <p className="uppercase tracking-wider">
            Sin actividad todavía — los partidos registrados aparecerán aquí
          </p>
          <p className="mt-1 text-sm">
            No mostramos estadísticas inventadas. Los resultados reales se
            publicarán cuando el motor de juego esté conectado.
          </p>
        </div>
      </section>
    </div>
  );
}
