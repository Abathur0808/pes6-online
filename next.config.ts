import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const nextConfig: NextConfig = {
  // Hay un package-lock.json en la carpeta padre (Desktop); fijar la raíz
  // para que Next no la confunda con la del proyecto.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
};

export default nextConfig;
