import { isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Indicador honesto del estado del servicio.
 * Verde: backend configurado. Ámbar: modo demo local (sin Supabase).
 */
export async function ServiceStatus() {
  const configured = isSupabaseConfigured();

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-carbon-600 bg-carbon-800 px-4 py-1.5 text-xs uppercase tracking-wider">
      <span
        className={`h-2 w-2 rounded-full ${
          configured ? "bg-pitch animate-pulse" : "bg-gold"
        }`}
      />
      {configured ? (
        <span className="text-pitch-light">Servicio operativo</span>
      ) : (
        <span className="text-gold">
          Modo demo — configura Supabase para activar cuentas y salas
        </span>
      )}
    </div>
  );
}
