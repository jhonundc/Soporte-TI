import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool, sql, executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

type BienImportRow = {
  Fila?: number;
  CodigoInventario?: string | null;
  CodigoPatrimonial?: string | null;
  Categoria?: string | null;
  Marca?: string | null;
  Area?: string | null;
  IdCategoria?: number | string | null;
  IdMarca?: number | string | null;
  IdArea?: number | string | null;
  NumeroSerie?: string | null;
  Descripcion?: string | null;
  Condicion?: string | null;
  EstadoBien?: string | null;
  IdCondicion?: number | string | null;
  IdEstadoBien?: number | string | null;
  FechaCompra?: string | Date | null;
  Modelo?: string | null;
};

type ImportResultado = {
  Fila: number;
  CodigoInventario: string;
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

function resolveCatalogId(
  explicitId: unknown,
  labelValue: unknown,
  lookup: Map<string, number>
): number | null {
  const id = toNullableInt(explicitId);
  if (id !== null) return id;
  const key = normalizeKey(labelValue);
  if (!key) return null;
  return lookup.get(key) ?? null;
}

function toNullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function toSafeText(value: unknown): string | null {
  const text = toNullableText(value);
  if (!text) return null;

  // Keep only SQL Server varchar-friendly chars to avoid TVP "Invalid string".
  // Allows basic Latin + Latin-1 supplement (incl. acentos/ñ) and removes unsupported Unicode.
  const cleaned = text
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .trim();
  if (!cleaned) return null;
  return cleaned;
}

function toNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function toNullableDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    // Excel serial date (1900-based)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
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
    const rows = Array.isArray(body?.bienes) ? (body.bienes as BienImportRow[]) : [];

    if (!rows.length) {
      return NextResponse.json(
        { error: "No se recibieron filas para importar." },
        { status: 400 }
      );
    }

    const pool = await getPool();

    const [categoriasResult, marcasResult, areasResult, estadosResult, condicionesResult] = await Promise.all([
      executeQuery("EXEC sp_ConsultaCategoriaBien @Accion = @Accion", { Accion: "L" }),
      executeQuery("EXEC sp_ConsultaMarca @Accion = @Accion", { Accion: "L" }),
      executeQuery("EXEC sp_ConsultaArea @Accion = @Accion", { Accion: "L" }),
      executeQuery("EXEC sp_ConsultaEstadoBien @Accion = @Accion", { Accion: "L" }),
      executeQuery("EXEC sp_ConsultaCondicionBien @Accion = @Accion", { Accion: "L" }),
    ]);

    const categoriasMap = buildLookupMapFromOptions(
      categoriasResult.recordset || [],
      ["IdCategoria"],
      ["CategoriaBien", "Categoria"]
    );
    const marcasMap = buildLookupMapFromOptions(
      marcasResult.recordset || [],
      ["IdMarca"],
      ["Marca"]
    );
    const areasMap = buildLookupMapFromOptions(
      areasResult.recordset || [],
      ["IdArea"],
      ["NombreArea", "Area"]
    );
    const estadosMap = buildLookupMapFromOptions(
      estadosResult.recordset || [],
      ["IdEstadoBien"],
      ["EstadoBien", "Estado"]
    );
    const condicionesMap = buildLookupMapFromOptions(
      condicionesResult.recordset || [],
      ["IdCondicion"],
      ["Condicion"]
    );

    const tvp = new sql.Table("dbo.BienesImportacionType");
    tvp.columns.add("Fila", sql.Int);
    tvp.columns.add("CodigoInventario", sql.VarChar(50));
    tvp.columns.add("CodigoPatrimonial", sql.VarChar(50));
    tvp.columns.add("IdCategoria", sql.Int);
    tvp.columns.add("IdMarca", sql.Int);
    tvp.columns.add("IdArea", sql.Int);
    tvp.columns.add("NumeroSerie", sql.VarChar(100));
    tvp.columns.add("Descripcion", sql.VarChar(255));
    tvp.columns.add("IdCondicion", sql.Int);
    tvp.columns.add("IdEstadoBien", sql.Int);
    tvp.columns.add("FechaCompra", sql.Date);
    tvp.columns.add("Modelo", sql.VarChar(150));

    const apiValidationErrors: ImportResultado[] = [];

    rows.forEach((row, index) => {
      const fila = toNullableInt(row.Fila) ?? index + 2;
      const codigoInventario = toSafeText(row.CodigoInventario) ?? "";
      const codigoPatrimonial = toSafeText(row.CodigoPatrimonial);
      const numeroSerie = toSafeText(row.NumeroSerie);
      const descripcion = toSafeText(row.Descripcion);
      const modelo = toSafeText(row.Modelo);

      const rowErrors: string[] = [];

      if (codigoInventario && codigoInventario.length > 50) rowErrors.push("Código de inventario excede 50 caracteres.");
      if (codigoPatrimonial && codigoPatrimonial.length > 50) rowErrors.push("Código patrimonial excede 50 caracteres.");
      if (numeroSerie && numeroSerie.length > 100) rowErrors.push("Número de serie excede 100 caracteres.");
      if (descripcion && descripcion.length > 255) rowErrors.push("Descripción excede 255 caracteres.");
      if (modelo && modelo.length > 150) rowErrors.push("Modelo excede 150 caracteres.");

      if (rowErrors.length) {
        apiValidationErrors.push({
          Fila: fila,
          CodigoInventario: codigoInventario || "",
          Estado: "ERROR",
          Mensaje: rowErrors.join(" "),
        });
        return;
      }

      try {
        tvp.rows.add(
          fila,
          codigoInventario || null,
          codigoPatrimonial,
          resolveCatalogId(row.IdCategoria, row.Categoria, categoriasMap),
          resolveCatalogId(row.IdMarca, row.Marca, marcasMap),
          resolveCatalogId(row.IdArea, row.Area, areasMap),
          numeroSerie,
          descripcion,
          resolveCatalogId(row.IdCondicion, row.Condicion, condicionesMap),
          resolveCatalogId(row.IdEstadoBien, row.EstadoBien, estadosMap),
          toNullableDate(row.FechaCompra),
          modelo
        );
      } catch (rowError: any) {
        apiValidationErrors.push({
          Fila: fila,
          CodigoInventario: codigoInventario || "",
          Estado: "ERROR",
          Mensaje: rowError?.message || "Fila inválida para importación.",
        });
      }
    });

    let spResultados: ImportResultado[] = [];
    let spResumen = { Insertados: 0, Errores: 0 };

    if (tvp.rows.length > 0) {
      const requestSp = pool
        .request()
        .input("Bienes", tvp)
        .input("IdUsuario", toNullableInt(payload.id) ?? 0);

      const result = await requestSp.execute("dbo.sp_ImportarBienes");

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

    console.log("[API] POST /api/bienes/importar", {
      filasRecibidas: rows.length,
      insertados: resumen?.Insertados ?? 0,
      errores: resumen?.Errores ?? 0,
    });

    return NextResponse.json({ resultados, resumen });
  } catch (error) {
    console.error("Error en POST /api/bienes/importar:", error);
    const message = (error as any)?.message || "Error al importar bienes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
