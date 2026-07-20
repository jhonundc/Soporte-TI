import { readFile } from "node:fs/promises";
import sql from "mssql";
import { config as loadEnv } from "dotenv";

const filePath = process.argv[2];
if (!filePath) throw new Error("Debe indicar la ruta del archivo SQL.");

loadEnv({ path: ".env", quiet: true });
const pool = await sql.connect({
  server: process.env.DB_SERVER || "localhost",
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_NAME || process.env.DB_DATABASE || "SoporteTI",
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  options: { encrypt: false, trustServerCertificate: true },
});

try {
  const source = await readFile(filePath, "utf8");
  const batches = source.split(/^\s*GO\s*$/gim).map((batch) => batch.trim()).filter(Boolean);
  for (const batch of batches) await pool.request().batch(batch);
  console.warn(`SQL aplicado correctamente: ${filePath}`);
} finally {
  await pool.close();
}
