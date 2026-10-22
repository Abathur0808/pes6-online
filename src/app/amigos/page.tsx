import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { FriendSearch } from "@/components/friend-search";
import { FriendActions } from "@/components/friend-actions";
import type { Friendship } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AmigosPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("friendships")
    .select("*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const all = (data as Friendship[]) ?? [];
  const friends = all.filter((f) => f.status === "accepted");
  const incoming = all.filter(
    (f) => f.status === "pending" && f.addressee_id === user.id
  );
  const outgoing = all.filter(
    (f) => f.status === "pending" && f.requester_id === user.id
  );
  const relatedIds = all.map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  function otherProfile(f: Friendship) {
    return f.requester_id === user!.id ? f.addressee : f.requester;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
        <span className="text-pitch">Amigos</span>
      </h1>

      {/* Buscar y añadir */}
      <section className="mt-6 rounded-lg border border-carbon-700 bg-carbon-800 p-5">
        <h2 className="font-sport text-sm font-semibold uppercase tracking-wider text-neutral-400">
          Añadir amigos
        </h2>
        <div className="mt-3">
          <FriendSearch excludeIds={relatedIds} />
        </div>
      </section>

      {/* Solicitudes recibidas */}
      {incoming.length > 0 && (
        <section className="mt-6 rounded-lg border border-gold/30 bg-gold/5 p-5">
          <h2 className="font-sport text-sm font-semibold uppercase tracking-wider text-gold">
            Solicitudes recibidas
          </h2>
          <ul className="mt-3 space-y-2">
            {incoming.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded border border-carbon-700 bg-carbon-900 px-3 py-2"
              >
                <span className="text-sm text-neutral-200">
                  {f.requester?.username ?? "Jugador"}
                </span>
                <FriendActions friendshipId={f.id} kind="incoming" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Solicitudes enviadas */}
      {outgoing.length > 0 && (
        <section className="mt-6 rounded-lg border border-carbon-700 bg-carbon-800 p-5">
          <h2 className="font-sport text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Solicitudes enviadas
          </h2>
          <ul className="mt-3 space-y-2">
            {outgoing.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded border border-carbon-700 bg-carbon-900 px-3 py-2"
              >
                <span className="text-sm text-neutral-200">
                  {f.addressee?.username ?? "Jugador"}{" "}
                  <span className="text-xs text-neutral-500">(pendiente)</span>
                </span>
                <FriendActions friendshipId={f.id} kind="outgoing" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Lista de amigos */}
      <section className="mt-6 rounded-lg border border-carbon-700 bg-carbon-800 p-5">
        <h2 className="font-sport text-sm font-semibold uppercase tracking-wider text-pitch-light">
          Tus amigos ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            Todavía no tienes amigos — busca por nombre de usuario arriba.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {friends.map((f) => {
              const p = otherProfile(f);
              return (
                <li
                  key={f.id}
                  className="flex items-center justify-between rounded border border-carbon-700 bg-carbon-900 px-3 py-2"
                >
                  <Link
                    href={`/amigos/${p?.id}`}
                    className="flex items-center gap-3 text-sm text-neutral-200 transition hover:text-pitch-light"
                  >
                    {p?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.avatar_url}
                        alt={p.username}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pitch font-sport text-sm font-bold text-carbon-950">
                        {(p?.username ?? "?")[0].toUpperCase()}
                      </span>
                    )}
                    {p?.username ?? "Jugador"}
                  </Link>
                  <span className="flex items-center gap-3">
                    <Link
                      href={`/amigos/${p?.id}`}
                      className="text-xs font-semibold uppercase tracking-wider text-gold hover:text-yellow-300"
                    >
                      Rivalidad
                    </Link>
                    <FriendActions friendshipId={f.id} kind="friend" />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
