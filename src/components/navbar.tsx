import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { NotificationBell } from "@/components/notification-bell";
import { MobileNav } from "@/components/mobile-nav";

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

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-carbon-700 bg-carbon-950/90 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-pitch font-sport text-sm font-bold text-carbon-950">
            P6
          </span>
          <span className="font-sport text-lg font-semibold uppercase tracking-wider">
            PES<span className="text-pitch">6</span> Online
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm uppercase tracking-wide text-neutral-400 transition hover:text-pitch-light"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <AuthButton />
          <MobileNav />
        </div>
      </nav>
    </header>
  );
}
