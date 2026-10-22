"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getNotifications } from "@/lib/notifications/actions";

const POLL_MS = 45_000;

/** Campana con contador en el navbar. Consulta las notificaciones
 *  agregadas al montar y cada 45s (barato: 4 selects ligeros). */
export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    async function load() {
      const res = await getNotifications();
      if (alive) setCount(res.count);
    }
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <Link
      href="/notificaciones"
      className="relative text-neutral-400 transition hover:text-pitch-light"
      aria-label={`Notificaciones${count > 0 ? ` (${count})` : ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-carbon-950">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
