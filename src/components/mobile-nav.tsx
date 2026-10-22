"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/salas", label: "Salas" },
  { href: "/buscar", label: "Buscar rival" },
  { href: "/amigos", label: "Amigos" },
  { href: "/modos", label: "Modos" },
  { href: "/ligas", label: "Ligas" },
  { href: "/ranking", label: "Ranking" },
  { href: "/torneos", label: "Torneos" },
  { href: "/como-jugar", label: "Cómo jugar" },
  { href: "/descargar", label: "Launcher" },
];

/** Menú hamburguesa para móvil — panel desplegable bajo el navbar. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar al cambiar de página.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        className="flex h-10 w-10 items-center justify-center rounded text-neutral-300 transition hover:bg-carbon-800 hover:text-pitch-light"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-14 border-b border-carbon-700 bg-carbon-950 pb-3 shadow-xl shadow-black/50">
          <ul className="mx-auto max-w-6xl px-4">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`block border-b border-carbon-800 py-3 text-sm uppercase tracking-wider transition ${
                    pathname === l.href
                      ? "text-pitch-light"
                      : "text-neutral-300 hover:text-pitch-light"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
