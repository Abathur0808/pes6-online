import Link from "next/link";

export default function DownloadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
        Descargar <span className="text-pitch">launcher</span>
      </h1>

      <p className="mt-4 text-neutral-400">
        El launcher conecta tu copia de PES 6 al servidor online: configura la
        red por ti y lanza el juego. Es un ejecutable nativo de Windows
        (~17 KB) — sin instalación ni dependencias.
      </p>

      <a
        href="/downloads/pes6-launcher.zip"
        download
        className="mt-8 inline-block rounded bg-pitch px-8 py-3 font-sport text-lg font-bold uppercase tracking-wider text-carbon-950 shadow-lg shadow-pitch/20 transition hover:bg-pitch-light"
      >
        Descargar PES6-Launcher.zip
      </a>

      <ol className="mt-10 space-y-4">
        <li className="rounded-lg border border-carbon-700 bg-carbon-800 p-5">
          <h2 className="font-sport font-semibold uppercase text-pitch-light">
            1. Descomprime el zip
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            En cualquier carpeta (p. ej. junto al juego en{" "}
            <code>D:\Games\pech</code>). Contiene el ejecutable, la
            configuración de servidores y el código fuente auditable.
          </p>
        </li>
        <li className="rounded-lg border border-carbon-700 bg-carbon-800 p-5">
          <h2 className="font-sport font-semibold uppercase text-pitch-light">
            2. Ejecuta PES6-Launcher.exe
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            Ejecutable nativo de Windows — sin instalación. Verifica que
            detecta tu juego, elige el servidor (PES6Club viene precargado) y
            crea tu cuenta desde el botón si no la tienes.
          </p>
        </li>
        <li className="rounded-lg border border-carbon-700 bg-carbon-800 p-5">
          <h2 className="font-sport font-semibold uppercase text-pitch-light">
            3. Jugar online
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            El launcher te pedirá permisos de administrador para configurar la
            red y abrirá el juego. En la pantalla de Red escribe{" "}
            <code className="text-pitch-light">usuario-contraseña</code>.
          </p>
        </li>
      </ol>

      <div className="mt-8 rounded-lg border border-gold/30 bg-gold/5 p-5 text-sm text-neutral-400">
        <strong className="text-gold">Aviso de seguridad:</strong> Windows
        SmartScreen puede mostrar una advertencia porque el ejecutable no está
        firmado digitalmente (firmar cuesta dinero; pendiente). El código
        fuente (<code>PES6Launcher.cs</code>) va incluido en el zip y es
        auditable: solo escribe un bloque marcado en el archivo{" "}
        <code>hosts</code> y lanza el juego. No descarga nada ni toca los
        archivos de PES 6.
      </div>

      <p className="mt-8 text-sm text-neutral-500">
        ¿Problemas de conexión? Consulta{" "}
        <Link href="/como-jugar" className="text-pitch-light underline">
          cómo jugar
        </Link>{" "}
        — puede hacer falta abrir el puerto UDP 5739 en tu router.
      </p>
    </div>
  );
}
