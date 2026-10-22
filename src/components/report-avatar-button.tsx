"use client";

import { useState } from "react";
import { reportAvatar } from "@/lib/profile/actions";

export function ReportAvatarButton({
  reportedId,
  username,
}: {
  reportedId: string;
  username: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );

  async function handle() {
    if (state !== "idle") return;
    if (!window.confirm(`¿Reportar la foto de ${username}? A los 3 reportes se elimina automáticamente.`)) {
      return;
    }
    setState("sending");
    const res = await reportAvatar(reportedId);
    setState(res.error ? "error" : "done");
  }

  if (state === "done") {
    return (
      <span className="text-[10px] uppercase tracking-wider text-neutral-500">
        Reporte enviado
      </span>
    );
  }

  return (
    <button
      onClick={handle}
      disabled={state === "sending"}
      className="text-[10px] uppercase tracking-wider text-neutral-500 underline transition hover:text-red-400 disabled:opacity-50"
      title="Reportar foto inapropiada"
    >
      {state === "sending" ? "Enviando…" : state === "error" ? "Error — reintentar" : "Reportar foto"}
    </button>
  );
}
