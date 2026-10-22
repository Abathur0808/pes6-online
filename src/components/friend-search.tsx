"use client";

import { useState } from "react";
import { searchProfiles, sendFriendRequest } from "@/lib/friends/actions";

type Found = { id: string; username: string; avatar_url: string | null };

export function FriendSearch({ excludeIds }: { excludeIds: string[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Found[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setSearching(true);
    const found = (await searchProfiles(query)) as Found[];
    setResults(found);
    setSearching(false);
  }

  async function add(id: string) {
    const res = await sendFriendRequest(id);
    if (res.ok) setSent((s) => new Set(s).add(id));
  }

  const visible = results.filter((p) => !excludeIds.includes(p.id));

  return (
    <div>
      <form onSubmit={search} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre de usuario…"
          className="flex-1 rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-pitch"
        />
        <button
          type="submit"
          disabled={searching}
          className="rounded border border-pitch px-4 py-2 text-sm font-semibold uppercase tracking-wider text-pitch-light transition hover:bg-pitch hover:text-carbon-950 disabled:opacity-50"
        >
          Buscar
        </button>
      </form>

      {visible.length > 0 && (
        <ul className="mt-3 space-y-2">
          {visible.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded border border-carbon-700 bg-carbon-900 px-3 py-2"
            >
              <span className="text-sm text-neutral-200">{p.username}</span>
              <button
                onClick={() => add(p.id)}
                disabled={sent.has(p.id)}
                className="text-xs font-semibold uppercase tracking-wider text-pitch-light hover:text-pitch disabled:opacity-50"
              >
                {sent.has(p.id) ? "Enviada ✓" : "+ Amigo"}
              </button>
            </li>
          ))}
        </ul>
      )}
      {results.length > 0 && visible.length === 0 && (
        <p className="mt-2 text-xs text-neutral-500">
          Ya tienes relación con esos usuarios.
        </p>
      )}
    </div>
  );
}
