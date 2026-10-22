export default function HowToPlayPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
        Cómo <span className="text-pitch">jugar</span>
      </h1>

      <ol className="mt-8 space-y-6">
        <li className="rounded-lg border border-carbon-700 bg-carbon-800 p-6">
          <h2 className="font-sport text-lg font-semibold uppercase text-pitch-light">
            1. Consigue el juego
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            Necesitas tu propia copia de{" "}
            <strong>Pro Evolution Soccer 6 para PC</strong> (o un equipo
            compatible). Esta plataforma no distribuye el juego ni material con
            copyright.
          </p>
        </li>

        <li className="rounded-lg border border-carbon-700 bg-carbon-800 p-6">
          <h2 className="font-sport text-lg font-semibold uppercase text-pitch-light">
            2. Crea tu cuenta
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            Regístrate, elige tu nombre de usuario y completa tu perfil. Tus
            estadísticas empiezan en cero y solo cuentan partidos verificados.
          </p>
        </li>

        <li className="rounded-lg border border-carbon-700 bg-carbon-800 p-6">
          <h2 className="font-sport text-lg font-semibold uppercase text-pitch-light">
            3. Entra a una sala
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            Crea una sala o únete con el código de 6 caracteres de tu rival.
            Acuerden duración y condiciones. El estado de la sala se sincroniza
            en tiempo real.
          </p>
        </li>

        <li className="rounded-lg border border-gold/40 bg-gold/5 p-6">
          <h2 className="font-sport text-lg font-semibold uppercase text-gold">
            4. Conexión del juego — estado actual
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            Hoy el partido se juega conectando el cliente de PES 6 a un servidor
            de red compatible (mismo mecanismo que usan los servidores
            comunitarios: redirección del dominio del gate + STUN, partido P2P
            por UDP). Estamos preparando nuestro propio servidor de
            coordinación. Ver{" "}
            <code className="text-neutral-300">
              docs/technical-feasibility.md
            </code>{" "}
            para el análisis completo.
          </p>
        </li>
      </ol>
    </div>
  );
}
