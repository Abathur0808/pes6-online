import Link from "next/link";

// TODO: pegar aquí el enlace directo de MediaFire cuando esté subido.
// Ejemplo: "https://www.mediafire.com/file/XXXXXXX/pes6-launcher.zip/file"
const MEDIAFIRE_URL = "";

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
      {/* Mirrors alternativos */}
      <section className="mt-10 rounded-lg border border-carbon-700 bg-carbon-800 p-5">
        <h2 className="font-sport font-semibold uppercase tracking-wide text-pitch-light">
          Descargas alternativas
        </h2>
        <p className="mt-1 text-sm text-neutral-400">
          Si la descarga directa te da problemas, usa uno de los mirrors:
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {MEDIAFIRE_URL ? (
            <a
              href={MEDIAFIRE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded border border-sky-400/50 bg-sky-400/10 px-6 py-2 font-sport uppercase tracking-wider text-sky-300 transition hover:bg-sky-400/20"
            >
              MediaFire ↗
            </a>
          ) : (
            <span className="inline-block rounded border border-carbon-600 px-6 py-2 font-sport uppercase tracking-wider text-neutral-500">
              MediaFire — disponible en breve
            </span>
          )}
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Mismo contenido que el zip oficial: launcher .exe + configuración +
          código fuente auditable. Verifica que el archivo se llame{" "}
          <code>pes6-launcher.zip</code>.
        </p>
      </section>

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
