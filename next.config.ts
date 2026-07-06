import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["mssql", "tedious", "bcrypt"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  turbopack: {
    // Evita que Turbopack use D:\Inventario_avance como raíz por el lockfile del padre
    root: projectRoot,
  },
  allowedDevOrigins: [
    'localhost',
    '.localhost',
    '127.0.0.1',
    ...(process.env.ALLOWED_DEV_ORIGINS ?? '').split(',').filter(Boolean),
  ],
};

export default nextConfig;
