"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthResult } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const initial: AuthResult = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUp, initial);

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-sport text-3xl font-bold uppercase">Crear cuenta</h1>
        <p className="mt-4 text-neutral-400">
          La autenticación requiere Supabase. Configura las variables de entorno
          (ver <code>.env.example</code>) y aplica{" "}
          <code>supabase/schema.sql</code> en tu proyecto.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="text-center font-sport text-3xl font-bold uppercase tracking-wide">
        Crear <span className="text-pitch">cuenta</span>
      </h1>

      <form
        action={formAction}
        className="mt-8 space-y-4 rounded-lg border border-carbon-700 bg-carbon-800 p-6"
      >
        <label className="block text-sm uppercase tracking-wide text-neutral-400">
          Nombre de usuario
          <input
            name="username"
            type="text"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_]+"
            className="mt-1 w-full rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-neutral-200 outline-none focus:border-pitch"
          />
        </label>
        <label className="block text-sm uppercase tracking-wide text-neutral-400">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-neutral-200 outline-none focus:border-pitch"
          />
        </label>
        <label className="block text-sm uppercase tracking-wide text-neutral-400">
          Contraseña
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded border border-carbon-600 bg-carbon-900 px-3 py-2 text-neutral-200 outline-none focus:border-pitch"
          />
        </label>

        {state.error && (
          <p className="rounded border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-pitch py-2.5 font-sport font-bold uppercase tracking-wider text-carbon-950 transition hover:bg-pitch-light disabled:opacity-50"
        >
          {pending ? "Creando…" : "Registrarse"}
        </button>

        <p className="text-center text-sm text-neutral-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-pitch-light underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
