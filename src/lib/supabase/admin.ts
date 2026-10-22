import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con service role — SOLO uso en servidor (server actions / route
 * handlers). Salta RLS. Reservado para operaciones que un usuario no puede
 * hacer sobre datos ajenos (ej. contar reportes, banear avatar).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
