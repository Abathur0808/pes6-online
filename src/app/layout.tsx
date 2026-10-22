import type { Metadata, Viewport } from "next";
import { Oswald } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PresenceProvider } from "@/components/presence-provider";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PES 6 Online — Fútbol retro multijugador",
  description:
    "Plataforma comunitaria para jugar Pro Evolution Soccer 6 online: salas, perfiles, equipos clásicos y torneos.",
};

/** Móvil: ancho real del dispositivo, respetando notches (safe-area). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={oswald.variable}>
      <body className="min-h-screen bg-carbon-950 text-neutral-200 antialiased">
        <div className="pitch-stripes flex min-h-screen flex-col">
          <PresenceProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </PresenceProvider>
        </div>
      </body>
    </html>
  );
}
