import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getNotifications } from "@/lib/notifications/actions";
import type { AppNotification } from "@/lib/notifications/actions";

export const dynamic = "force-dynamic";

const KIND_META: Record<
  AppNotification["kind"],
  { icon: string; label: string; color: string }
> = {
  friend_request: {
    icon: "👥",
    label: "Amistad",
    color: "text-pitch-light",
  },
  confirm_score: {
    icon: "✅",
    label: "Confirmar resultado",
    color: "text-gold",
  },
  league_match: {
    icon: "⚽",
    label: "Partido de liga",
    color: "text-sky-300",
  },
  commend: {
    icon: "🤝",
    label: "Elogio",
    color: "text-gold",
  },
};

export default async function NotificacionesPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { items } = await getNotifications();

  // Orden de importancia: lo que requiere acción primero.
  const order: AppNotification["kind"][] = [
    "confirm_score",
    "friend_request",
    "league_match",
    "commend",
  ];
  const sorted = [...items].sort(
    (a, b) => order.indexOf(a.kind) - order.indexOf(b.kind)
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
        <span className="text-pitch">Notificaciones</span>
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Solicitudes, resultados por confirmar y tus partidos pendientes.
      </p>

      {sorted.length === 0 ? (
        <div className="mt-6 rounded-lg border border-carbon-700 bg-carbon-800 p-8 text-center">
          <p className="text-4xl">🔕</p>
          <p className="mt-3 text-sm text-neutral-400">
            Todo al día — no hay nada pendiente.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {sorted.map((n, i) => {
            const meta = KIND_META[n.kind];
            return (
              <li key={i}>
                <Link
                  href={n.href}
                  className="flex items-center gap-4 rounded-lg border border-carbon-700 bg-carbon-800 px-4 py-3 transition hover:border-pitch/60 hover:bg-carbon-900"
                >
                  <span className="text-xl">{meta.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-neutral-200">{n.text}</p>
                    {n.detail && (
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {n.detail}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider ${meta.color}`}
                  >
                    {meta.label} →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
