# PES 6 Online — Launcher de escritorio

Ejecutable nativo de Windows (`PES6-Launcher.exe`, ~17 KB). Sin instalación
ni dependencias. El código fuente (`PES6Launcher.cs`) se incluye para
transparencia — puedes auditarlo o recompilarlo tú mismo.

## Uso

1. Ejecuta **`PES6-Launcher.exe`** (doble clic).
2. Verifica la ruta del juego (por defecto `D:\Games\pech\PECH CLASSIC PATCH`;
   detecta `PECHCP.exe` o `PES6.exe`).
3. Elige el **servidor** en el desplegable. Preset por defecto: **PES6Club**
   (`154.38.190.60`, verificado activo). Si no tienes cuenta, pulsa
   **«Crear cuenta en el servidor»** — abre
   [pes6club.com/enroll](https://pes6club.com/enroll).
   Registra ahí el **serial** de tu PES 6 (se muestra al entrar en modo Red).
4. **JUGAR ONLINE**: escribe el bloque `PES6-ONLINE` en el archivo `hosts`
   (pide admin), hace `ipconfig /flushdns` y lanza el juego.
   En la pantalla de red del juego, la contraseña es `usuario-contraseña`
   (unidas con guion medio, p. ej. `Luis-Diaz1997`).
5. **JUGAR OFFLINE** / **Restaurar hosts**: elimina el bloque gestionado y
   deja el sistema como estaba.
6. **Actualizar servidores**: descarga la lista de presets desde la API de la
   plataforma (`serversUrl` en la config) sin reinstalar nada.

## Contenido del zip

| Archivo | Descripción |
|---|---|
| `PES6-Launcher.exe` | El ejecutable — punto de entrada |
| `launcher.config.json` | Ruta del juego, exes, servidores, URL de la API |
| `PES6Launcher.cs` | Código fuente del exe (auditable) |
| `PES6-Launcher.ps1` / `.bat` | Versión PowerShell equivalente (referencia) |

## Recompilar el exe (opcional)

No requiere instalar nada — `csc.exe` viene con Windows:

```powershell
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe `
  /out:PES6-Launcher.exe `
  /r:System.dll,System.Drawing.dll,System.Windows.Forms.dll,System.Runtime.Serialization.dll `
  PES6Launcher.cs
```

## Servidores

Definidos en `launcher.config.json` → `servers`. Cada entrada:

```json
{
  "name": "PES6Club",
  "gateIp": "154.38.190.60",
  "stunIp": "154.38.190.60",
  "signupUrl": "https://pes6club.com/enroll",
  "note": "Comunidad hispana activa..."
}
```

- `Personalizado` queda para nuestro propio fiveserver/sixserver en VPS.
- Las IPs de comunidades pueden cambiar; edítalas desde la GUI (se guardan
  en el preset) o en el JSON.

## Qué hace y qué no

- **Hace**: redirige los dominios del juego al servidor elegido vía `hosts`
  (mismo mecanismo documentado por la comunidad) y lanza el exe del juego.
- **No hace**: descargar juegos, parches ni ROMs; ni toca archivos del juego.
- La escritura de `hosts` es reversible: todo lo que añade queda entre
  `# PES6-ONLINE BEGIN` / `# PES6-ONLINE END`.

## Limitaciones conocidas

- El exe no está firmado digitalmente → SmartScreen puede advertir.
- Requiere admin para `hosts` (el launcher ofrece re-elevarse).
- CGNAT/NAT simétrico puede impedir el P2P incluso con servidor correcto.
  Puede ser necesario abrir el puerto UDP 5739 en el router —
  ver `docs/technical-feasibility.md`.
- El serial registrado en la web del servidor debe ser **idéntico** al que
  muestra tu copia del juego; si no, el login in-game será rechazado.
