import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool, sql, executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

type ComponenteImportRow = {
  Fila?: number;
  NombreComponente?: string | null;
  Marca?: string | null;
  IdMarca?: number | string | null;
  Modelo?: string | null;
  NumeroSerie?: string | null;
  Capacidad?: string | null;
  Observacion?: string | null;
  Cantidad?: number | string | null;
};

type ImportResultado = {
  Fila: number;
  NombreComponente: string;
  Estado: "OK" | "ERROR";
  Mensaje: string;
};

function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function toNullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function toSafeText(value: unknown): string | null {
  const text = toNullableText(value);
  if (!text) return null;

  const cleaned = text
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .trim();

  return cleaned || null;
}

function toNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function buildLookupMapFromOptions(rows: any[], idKeys: string[], labelKeys: string[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const row of rows || []) {
    const id = idKeys.map((k) => toNullableInt(row?.[k])).find((v) => v !== null) ?? null;
    const label = labelKeys.map((k) => toNullableText(row?.[k])).find((v) => !!v) ?? null;
    if (id !== null && label) {
      map.set(normalizeKey(label), id);
    }
  }

  return map;
}

function resolveCatalogId(explicitId: unknown, labelValue: unknown, lookup: Map<string, number>): number | null {
  const id = toNullableInt(explicitId);
  if (id !== null) return id;
  const key = normalizeKey(labelValue);
  if (!key) return null;
  return lookup.get(key) ?? null;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.id) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const body = await request.json();
    const rows = Array.isArray(body?.componentes) ? (body.componentes as ComponenteImportRow[]) : [];

    if (!rows.length) {
      return NextResponse.json({ error: "No se recibieron filas para importar." }, { status: 400 });
    }

    const pool = await getPool();

    const marcasResult = await executeQuery("EXEC sp_ConsultaMarca @Accion = @Accion", { Accion: "L" });
    const marcasMap = buildLookupMapFromOptions(marcasResult.recordset || [], ["IdMarca"], ["Marca"]);

    const tvp = new sql.Table("dbo.ComponentesImportacionType");
    tvp.columns.add("Fila", sql.Int);
    tvp.columns.add("NombreComponente", sql.VarChar(150));
    tvp.columns.add("IdMarca", sql.Int);
    tvp.columns.add("Modelo", sql.VarChar(150));
    tvp.columns.add("NumeroSerie", sql.VarChar(100));
    tvp.columns.add("Capacidad", sql.VarChar(100));
    tvp.columns.add("Observacion", sql.VarChar(255));
    tvp.columns.add("Cantidad", sql.Int);

    const apiValidationErrors: ImportResultado[] = [];

    rows.forEach((row, index) => {
      const fila = toNullableInt(row.Fila) ?? index + 2;
      const nombreComponente = toSafeText(row.NombreComponente) ?? "";
      const modelo = toSafeText(row.Modelo);
      const numeroSerie = toSafeText(row.NumeroSerie);
      const capacidad = toSafeText(row.Capacidad);
      const observacion = toSafeText(row.Observacion);
      const cantidad = toNullableInt(row.Cantidad);

      const rowErrors: string[] = [];

      if (!nombreComponente) rowErrors.push("Nombre del componente obligatorio.");
      if (nombreComponente && nombreComponente.length > 150) rowErrors.push("NombreComponente excede 150 caracteres.");
      if (modelo && modelo.length > 150) rowErrors.push("Modelo excede 150 caracteres.");
      if (numeroSerie && numeroSerie.length > 100) rowErrors.push("Número de serie excede 100 caracteres.");
      if (capacidad && capacidad.length > 100) rowErrors.push("Capacidad excede 100 caracteres.");
      if (observacion && observacion.length > 255) rowErrors.push("Observación excede 255 caracteres.");
      if ((cantidad ?? 0) <= 0) rowErrors.push("La cantidad debe ser mayor a cero.");

      const idMarca = resolveCatalogId(row.IdMarca, row.Marca, marcasMap);
      if (!idMarca) rowErrors.push("Marca inexistente o inactiva.");

      if (rowErrors.length) {
        apiValidationErrors.push({
          Fila: fila,
          NombreComponente: nombreComponente || "",
          Estado: "ERROR",
          Mensaje: rowErrors.join(" "),
        });
        return;
      }

      try {
        tvp.rows.add(
          fila,
          nombreComponente,
          idMarca,
          modelo,
          numeroSerie,
          capacidad,
          observacion,
          cantidad
        );
      } catch (rowError: any) {
        apiValidationErrors.push({
          Fila: fila,
          NombreComponente: nombreComponente || "",
          Estado: "ERROR",
          Mensaje: rowError?.message || "Fila inválida para importación.",
        });
      }
    });

    let spResultados: ImportResultado[] = [];
    let spResumen = { Insertados: 0, Errores: 0 };

    if (tvp.rows.length > 0) {
      const result = await pool.request().input("Componentes", tvp).execute("dbo.sp_ImportarComponentes");

      const recordsets = Array.isArray(result.recordsets)
        ? result.recordsets
        : Object.values(result.recordsets ?? {});

      spResultados = (recordsets[0] ?? []) as ImportResultado[];
      spResumen = recordsets[1]?.[0] ?? { Insertados: 0, Errores: 0 };
    }

    const resultados = [...spResultados, ...apiValidationErrors].sort((a, b) => (a.Fila || 0) - (b.Fila || 0));
    const resumen = {
      Insertados: spResumen.Insertados ?? 0,
      Errores: (spResumen.Errores ?? 0) + apiValidationErrors.length,
    };

    return NextResponse.json({ resultados, resumen });
  } catch (error) {
    console.error("Error en POST /api/componentes/importar:", error);
    const message = (error as any)?.message || "Error al importar componentes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
