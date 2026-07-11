import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery, getPool, sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

type SoftwareImportRow = {
  Fila?: number;
  IdSoftwareCatalogo?: number | string | null;
  NombreSoftware?: string | null;
  IdTipoSoftware?: number | string | null;
  TipoSoftware?: string | null;
  VersionSoftware?: string | null;
  IdProveedor?: number | string | null;
  ProveedorEntidad?: string | null;
  IdTipoLicencia?: number | string | null;
  TipoLicencia?: string | null;
  CantidadLicencias?: number | string | null;
  IdEstadoLicencia?: number | string | null;
  EstadoLicencia?: string | null;
  FechaCaducidad?: string | Date | null;
  IdTipoAsignacion?: number | string | null;
  TipoAsignacion?: string | null;
  UsoFinalidad?: string | null;
};

type ImportResultado = {
  Fila: number;
  NombreSoftware?: string;
  IdSoftwareCatalogo?: number;
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

function toNullableDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
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
    const rows = Array.isArray(body?.software) ? (body.software as SoftwareImportRow[]) : [];

    if (!rows.length) {
      return NextResponse.json(
        { error: "No se recibieron filas para importar." },
        { status: 400 }
      );
    }

    const pool = await getPool();

    const [
      softwareCatalogoResult,
      tiposSoftwareResult,
      proveedoresResult,
      tiposLicenciaResult,
      estadosLicenciaResult,
      tiposAsignacionResult,
    ] = await Promise.all([
      executeQuery(
        "SELECT IdSoftwareCatalogo, NombreSoftware FROM SoftwareCatalogo WHERE Activo = 1"
      ),
      executeQuery(
        "SELECT IdTipoSoftware, TipoSoftware FROM TipoSoftware WHERE Activo = 1"
      ),
      executeQuery(
        "SELECT IdProveedor, Proveedor FROM Proveedores WHERE Activo = 1"
      ),
      executeQuery(
        "SELECT IdTipoLicencia, TipoLicencia FROM TipoLicencia WHERE Activo = 1"
      ),
      executeQuery(
        "SELECT IdEstadoLicencia, EstadoLicencia FROM EstadosLicencia WHERE Activo = 1"
      ),
      executeQuery(
        "SELECT IdTipoAsignacion, TipoAsignacion FROM TipoAsignacionSoftware WHERE Activo = 1"
      ),
    ]);

    const softwareCatalogoMap = buildLookupMapFromOptions(
      softwareCatalogoResult.recordset || [],
      ["IdSoftwareCatalogo"],
      ["NombreSoftware"]
    );
    const tiposSoftwareMap = buildLookupMapFromOptions(
      tiposSoftwareResult.recordset || [],
      ["IdTipoSoftware"],
      ["TipoSoftware"]
    );
    const proveedoresMap = buildLookupMapFromOptions(
      proveedoresResult.recordset || [],
      ["IdProveedor"],
      ["Proveedor"]
    );
    const tiposLicenciaMap = buildLookupMapFromOptions(
      tiposLicenciaResult.recordset || [],
      ["IdTipoLicencia"],
      ["TipoLicencia"]
    );
    const estadosLicenciaMap = buildLookupMapFromOptions(
      estadosLicenciaResult.recordset || [],
      ["IdEstadoLicencia"],
      ["EstadoLicencia"]
    );
    const tiposAsignacionMap = buildLookupMapFromOptions(
      tiposAsignacionResult.recordset || [],
      ["IdTipoAsignacion"],
      ["TipoAsignacion"]
    );

    const tvp = new sql.Table("dbo.BienesSoftwareImportacionType");
    tvp.columns.add("Fila", sql.Int);
    tvp.columns.add("IdSoftwareCatalogo", sql.Int);
    tvp.columns.add("IdTipoSoftware", sql.Int);
    tvp.columns.add("VersionSoftware", sql.VarChar(100));
    tvp.columns.add("IdProveedor", sql.Int);
    tvp.columns.add("IdTipoLicencia", sql.Int);
    tvp.columns.add("CantidadLicencias", sql.Int);
    tvp.columns.add("IdEstadoLicencia", sql.Int);
    tvp.columns.add("FechaCaducidad", sql.Date);
    tvp.columns.add("IdTipoAsignacion", sql.Int);
    tvp.columns.add("UsoFinalidad", sql.VarChar(255));

    const apiValidationErrors: ImportResultado[] = [];

    rows.forEach((row, index) => {
      const fila = toNullableInt(row.Fila) ?? index + 2;
      const nombreSoftware = toSafeText(row.NombreSoftware) ?? "";
      const tipoSoftware = toSafeText(row.TipoSoftware);
      const versionSoftware = toSafeText(row.VersionSoftware);
      const proveedorEntidad = toSafeText(row.ProveedorEntidad);
      const tipoLicencia = toSafeText(row.TipoLicencia);
      const cantidadLicencias = toNullableInt(row.CantidadLicencias);
      const estadoLicencia = toSafeText(row.EstadoLicencia);
      const tipoAsignacion = toSafeText(row.TipoAsignacion);
      const usoFinalidad = toSafeText(row.UsoFinalidad);
      const fechaCaducidad = toNullableDate(row.FechaCaducidad);

      const idSoftwareCatalogo = resolveCatalogId(
        row.IdSoftwareCatalogo,
        nombreSoftware,
        softwareCatalogoMap
      );
      const idTipoSoftware = resolveCatalogId(row.IdTipoSoftware, tipoSoftware, tiposSoftwareMap);
      const idProveedor = resolveCatalogId(row.IdProveedor, proveedorEntidad, proveedoresMap);
      const idTipoLicencia = resolveCatalogId(row.IdTipoLicencia, tipoLicencia, tiposLicenciaMap);
      const idEstadoLicencia = resolveCatalogId(row.IdEstadoLicencia, estadoLicencia, estadosLicenciaMap);
      const idTipoAsignacion = resolveCatalogId(
        row.IdTipoAsignacion,
        tipoAsignacion,
        tiposAsignacionMap
      );

      const rowErrors: string[] = [];

      if (!idSoftwareCatalogo) rowErrors.push("Software inexistente o inactivo.");
      if (!idTipoSoftware) rowErrors.push("Tipo de software inexistente o inactivo.");
      if (!idProveedor) rowErrors.push("Proveedor inexistente o inactivo.");
      if (!idTipoLicencia) rowErrors.push("Tipo de licencia inexistente o inactivo.");
      if (!idEstadoLicencia) rowErrors.push("Estado de licencia inexistente o inactivo.");
      if (!idTipoAsignacion) rowErrors.push("Tipo de asignación inexistente o inactivo.");
      if (!versionSoftware) rowErrors.push("Versión de software obligatoria.");
      if ((cantidadLicencias ?? 0) <= 0) rowErrors.push("La cantidad de licencias debe ser mayor a cero.");

      if (versionSoftware && versionSoftware.length > 100) rowErrors.push("VersionSoftware excede 100 caracteres.");
      if (usoFinalidad && usoFinalidad.length > 255) rowErrors.push("UsoFinalidad excede 255 caracteres.");

      if (rowErrors.length) {
        apiValidationErrors.push({
          Fila: fila,
          NombreSoftware: nombreSoftware || "",
          IdSoftwareCatalogo: idSoftwareCatalogo ?? undefined,
          Estado: "ERROR",
          Mensaje: rowErrors.join(" "),
        });
        return;
      }

      try {
        tvp.rows.add(
          fila,
          idSoftwareCatalogo,
          idTipoSoftware,
          versionSoftware,
          idProveedor,
          idTipoLicencia,
          cantidadLicencias,
          idEstadoLicencia,
          fechaCaducidad,
          idTipoAsignacion,
          usoFinalidad
        );
      } catch (rowError: any) {
        apiValidationErrors.push({
          Fila: fila,
          NombreSoftware: nombreSoftware || "",
          IdSoftwareCatalogo: idSoftwareCatalogo ?? undefined,
          Estado: "ERROR",
          Mensaje: rowError?.message || "Fila inválida para importación.",
        });
      }
    });

    let spResultados: ImportResultado[] = [];
    let spResumen = { Insertados: 0, Errores: 0 };

    if (tvp.rows.length > 0) {
      const result = await pool
        .request()
        .input("Software", tvp)
        .execute("dbo.sp_ImportarBienesSoftware");

      const recordsets = Array.isArray(result.recordsets)
        ? result.recordsets
        : Object.values(result.recordsets ?? {});

      spResultados = (recordsets[0] ?? []) as ImportResultado[];
      spResumen = recordsets[1]?.[0] ?? { Insertados: 0, Errores: 0 };
    }

    const resultados = [...spResultados, ...apiValidationErrors].sort(
      (a, b) => (a.Fila || 0) - (b.Fila || 0)
    );
    const resumen = {
      Insertados: spResumen.Insertados ?? 0,
      Errores: (spResumen.Errores ?? 0) + apiValidationErrors.length,
    };

    return NextResponse.json({ resultados, resumen });
  } catch (error) {
    console.error("Error en POST /api/software/importar:", error);
    const message = (error as any)?.message || "Error al importar software";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}