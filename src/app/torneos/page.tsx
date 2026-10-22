export default function TournamentsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
        <span className="text-gold">Torneos</span>
      </h1>

      <div className="mt-8 rounded-lg border border-carbon-700 bg-carbon-800 p-8 text-center">
        <p className="font-sport text-xl uppercase tracking-wider text-neutral-300">
          Próximamente
        </p>
        <p className="mx-auto mt-3 max-w-lg text-sm text-neutral-500">
          El modelo de datos para torneos, participantes y brackets ya está
          definido en <code>supabase/schema.sql</code>. La competición se
          habilitará cuando el motor de partidos reporte resultados verificables
          por el servidor — no antes, para evitar rankings falsificables.
        </p>
      </div>
    </div>
  );
}
