import sql from "mssql";
import { config as dotenvConfig } from "dotenv";

declare global {
  var mssqlPool: sql.ConnectionPool | undefined;
  var __dotenvLoaded: boolean | undefined;
}

if (!globalThis.__dotenvLoaded) {
  dotenvConfig({ path: ".env" });
  globalThis.__dotenvLoaded = true;
}

const getEnv = (key: string, fallback = "") => process.env[key]?.trim() ?? fallback;

const config: sql.config = {
  server: getEnv("DB_SERVER") || "localhost",
  port: getEnv("DB_PORT") ? parseInt(getEnv("DB_PORT"), 10) : 1433,
  database: getEnv("DB_NAME") || getEnv("DB_DATABASE") || "SoporteTI",
  user: getEnv("DB_USER") || "",
  password: getEnv("DB_PASS") || "",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    cryptoCredentialsDetails: {
      minVersion: "TLSv1",
    }
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 15000,
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

async function createPool(): Promise<sql.ConnectionPool> {
  const pool = new sql.ConnectionPool(config);
  pool.on("error", (err) => {
    console.error("SQL Pool error:", err);
    globalThis.mssqlPool = undefined;
  });
  await pool.connect();
  return pool;
}

export async function getPool(): Promise<sql.ConnectionPool> {
  // Si el pool global existe y está conectado, úsalo
  if (globalThis.mssqlPool?.connected) {
    return globalThis.mssqlPool;
  }

  // Si existe pero no está conectado, limpiarlo
  if (globalThis.mssqlPool && !globalThis.mssqlPool.connected) {
    try {
      await globalThis.mssqlPool.close();
    } catch {}
    globalThis.mssqlPool = undefined;
  }

  // Crear nueva conexión
  globalThis.mssqlPool = await createPool();
  return globalThis.mssqlPool;
}

function addParams(request: sql.Request, params: Record<string, unknown>) {
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      request.input(key, null);
      continue;
    }

    if (typeof value === "number" || typeof value === "boolean" || value instanceof Date) {
      request.input(key, value);
      continue;
    }

    if (Buffer.isBuffer(value)) {
      request.input(key, value);
      continue;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") {
        request.input(key, null);
        continue;
      }

      const lowerKey = key.toLowerCase();
      if (["idbiencomponente", "idcomponente", "idusuario", "cantidad"].some((idKey) => lowerKey === idKey || lowerKey.includes(idKey))) {
        const parsed = parseInt(trimmed, 10);
        if (!Number.isNaN(parsed)) {
          request.input(key, parsed);
          continue;
        }
      }

      request.input(key, trimmed);
      continue;
    }

    try {
      request.input(key, String(value));
    } catch (err) {
      request.input(key, null);
    }
  }
}

export async function executeQuery<T = any>(
  sqlQuery: string,
  params: Record<string, any> = {}
): Promise<sql.IResult<T>> {
  const connectionPool = await getPool();
  const request = connectionPool.request();
  addParams(request, params);
  try {
    return await request.query<T>(sqlQuery);
  } catch (err: any) {
    // Si la conexión se cerró durante la consulta, reintentar una vez
    if (err?.code === "ECONNCLOSED" || err?.code === "ECONNRESET") {
      globalThis.mssqlPool = undefined;
      const freshPool = await getPool();
      const retryRequest = freshPool.request();
      addParams(retryRequest, params);
      return retryRequest.query<T>(sqlQuery);
    }
    throw err;
  }
}

export async function executeTransactionQuery<T = any>(
  transaction: sql.Transaction,
  sqlQuery: string,
  params: Record<string, any> = {}
): Promise<sql.IResult<T>> {
  const request = transaction.request();
  addParams(request, params);
  return request.query<T>(sqlQuery);
}

export { sql };
