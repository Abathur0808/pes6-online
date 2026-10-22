import { ConnectivityTest } from "@/components/connectivity-test";

export default function ConnectivityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
        Prueba de <span className="text-pitch">conectividad</span>
      </h1>
      <p className="mt-3 text-sm text-neutral-400">
        Prueba de concepto: dos clientes establecen un canal P2P WebRTC con
        signaling por Supabase Realtime. Demuestra NAT traversal y mensajería
        bidireccional — <strong>no</strong> demuestra que PES 6 funcione en el
        navegador (el juego requiere su cliente de PC). Abre esta página en dos
        navegadores/pestañas distintas.
      </p>
      <div className="mt-8">
        <ConnectivityTest />
      </div>
    </div>
  );
}
