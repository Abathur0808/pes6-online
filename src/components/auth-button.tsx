"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/perfil"
          className="max-w-28 truncate text-sm uppercase tracking-wide text-pitch-light hover:underline"
        >
          {user.user_metadata?.username ?? user.email}
        </Link>
        <button
          onClick={signOut}
          className="rounded border border-carbon-600 px-3 py-1.5 text-xs uppercase tracking-wide text-neutral-400 transition hover:border-pitch hover:text-pitch-light"
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm uppercase tracking-wide text-neutral-400 transition hover:text-pitch-light"
      >
        Entrar
      </Link>
      <Link
        href="/registro"
        className="rounded bg-pitch px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-carbon-950 transition hover:bg-pitch-light"
      >
        Crear cuenta
      </Link>
    </div>
  );
}
