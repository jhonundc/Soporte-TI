import sql from "mssql";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });

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

declare global {
  var mssqlPool: sql.ConnectionPool | undefined;
}

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
<<<<<<< HEAD
    const lowerKey = key.toLowerCase();
    try {
      // null / undefined
      if (value === null || value === undefined) {
        request.input(key, null);
        continue;
      }

      // Numbers
      if (typeof value === "number") {
        if (!Number.isFinite(value)) {
          request.input(key, null);
        } else {
          request.input(key, value);
        }
        continue;
      }

      // Strings -> coerce common conventions
      if (typeof value === "string") {
        if (lowerKey.includes("fecha") && !Number.isNaN(Date.parse(value))) {
          request.input(key, new Date(value));
        } else if (lowerKey.includes("id") && /^\d+$/.test(value)) {
          request.input(key, parseInt(value, 10));
        } else if (lowerKey.includes("activo") && /^(true|false)$/i.test(value)) {
          request.input(key, value.toLowerCase() === "true");
        } else {
          request.input(key, value);
        }
        continue;
      }

      // Date objects
      if (value instanceof Date) {
        request.input(key, value);
        continue;
      }

      // Booleans
      if (typeof value === "boolean") {
        request.input(key, value);
        continue;
      }

      // Buffer -> send base64 string
      if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
        request.input(key, value.toString("base64"));
        continue;
      }

      // Objects (including accidental sql type objects) -> defensive handling
      if (typeof value === "object") {
        // Detect if caller accidentally passed a mssql type descriptor as the param value
        // A type descriptor created by sql.VarChar(50) will look like { type: [sql.VarChar], length: 50 }
        if ("type" in value && ("length" in value || "precision" in value || "scale" in value)) {
          // Caller likely passed a raw type descriptor by mistake.
          console.warn(`Param ${key} appears to be a mssql type descriptor; coercing to safe types.`);
          request.input(key, null);
          continue;
        }

        // For plain objects, stringify as JSON
        try {
          request.input(key, JSON.stringify(value));
        } catch (e) {
          request.input(key, String(value));
        }
        continue;
      }

      // Fallback: coerce to string
      request.input(key, String(value));
    } catch (err) {
      // As a last resort try the original request.input signature and log the error
      try {
        request.input(key, value as any);
      } catch (e) {
        console.warn(`No se pudo asignar parámetro ${key}`, e);
      }
    }
=======
    request.input(key, value as never);
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5
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

export { sql };
