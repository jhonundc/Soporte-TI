import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

type CatalogOption = {
  id: number;
  nombre: string;
};

function toNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function toNullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function buildUniqueOptions(rows: any[], idKeys: string[], nameKeys: string[]): CatalogOption[] {
  const map = new Map<number, string>();

  for (const row of rows || []) {
    const id = idKeys.map((k) => toNullableInt(row?.[k])).find((v) => v !== null) ?? null;
    const name = nameKeys.map((k) => toNullableText(row?.[k])).find((v) => !!v) ?? null;
    if (!id || !name) continue;
    map.set(id, name);
  }

  return Array.from(map.entries())
    .map(([id, nombre]) => ({ id, nombre }))
    .sort((a, b) => normalizeKey(a.nombre).localeCompare(normalizeKey(b.nombre), "es"));
}

function buildProveedorOptions(rows: any[]): CatalogOption[] {
  const map = new Map<number, string>();

  for (const row of rows || []) {
    const knownId = [
      "IdProveedor",
      "IDProveedor",
      "idProveedor",
      "idproveedor",
      "Id",
      "id",
    ]
      .map((k) => toNullableInt(row?.[k]))
      .find((v) => v !== null);

    const knownName = [
      "Proveedor",
      "NombreProveedor",
      "ProveedorEntidad",
      "Nombre",
      "proveedor",
      "nombreProveedor",
      "proveedorEntidad",
      "nombre",
    ]
      .map((k) => toNullableText(row?.[k]))
      .find((v) => !!v);

    // Fallback heuristic for unexpected column names in SP result.
    const rowEntries = Object.entries(row || {});
    const heuristicId =
      knownId ??
      rowEntries
        .filter(([k]) => normalizeKey(k).includes("idproveedor") || normalizeKey(k) === "id")
        .map(([, v]) => toNullableInt(v))
        .find((v) => v !== null) ??
      null;

    const heuristicName =
      knownName ??
      rowEntries
        .filter(([k]) => normalizeKey(k).includes("proveedor") || normalizeKey(k).includes("nombre"))
        .map(([, v]) => toNullableText(v))
        .find((v) => !!v) ??
      null;

    if (!heuristicId || !heuristicName) continue;
    map.set(heuristicId, heuristicName);
  }

  return Array.from(map.entries())
    .map(([id, nombre]) => ({ id, nombre }))
    .sort((a, b) => normalizeKey(a.nombre).localeCompare(normalizeKey(b.nombre), "es"));
}

async function getProveedoresCatalogo() {
  const tries = [
    () => executeQuery("EXEC sp_ConsultaProveedor @Accion = @Accion", { Accion: "L" }),
    () => executeQuery("EXEC sp_ConsultaProveedor"),
    () => executeQuery("SELECT IdProveedor, Proveedor FROM Proveedores WHERE Activo = 1 ORDER BY Proveedor ASC"),
  ];

  for (const run of tries) {
    try {
      const result = await run();
      const rows = result?.recordset || [];
      if (rows.length) return rows;
    } catch {
      // Keep trying fallbacks.
    }
  }

  return [];
}

export async function GET() {
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

    const [
      softwareCatalogoResult,
      tiposSoftwareResult,
      proveedoresRows,
      tiposLicenciaResult,
      estadosLicenciaResult,
      tiposAsignacionResult,
    ] = await Promise.all([
      executeQuery("EXEC sp_ConsultaSoftwareCatalogo @Accion = @Accion", { Accion: "L" }),
      executeQuery("EXEC sp_ConsultaTipoSoftware @Accion = @Accion", { Accion: "L" }),
      getProveedoresCatalogo(),
      executeQuery("EXEC sp_ConsultaTipoLicencia @Accion = @Accion", { Accion: "L" }),
      executeQuery("EXEC sp_ConsultaEstadoLicencia @Accion = @Accion", { Accion: "L" }),
      executeQuery("EXEC sp_ConsultaTipoAsignacionSoftware @Accion = @Accion", { Accion: "L" }),
    ]);

    const softwareCatalogo = buildUniqueOptions(
      softwareCatalogoResult.recordset || [],
      ["IdSoftwareCatalogo"],
      ["NombreSoftware"]
    );
    const tiposSoftware = buildUniqueOptions(
      tiposSoftwareResult.recordset || [],
      ["IdTipoSoftware"],
      ["TipoSoftware"]
    );
    const proveedores = buildProveedorOptions(proveedoresRows || []);
    const tiposLicencia = buildUniqueOptions(
      tiposLicenciaResult.recordset || [],
      ["IdTipoLicencia"],
      ["TipoLicencia"]
    );
    const estadosLicencia = buildUniqueOptions(
      estadosLicenciaResult.recordset || [],
      ["IdEstadoLicencia"],
      ["EstadoLicencia"]
    );
    const tiposAsignacion = buildUniqueOptions(
      tiposAsignacionResult.recordset || [],
      ["IdTipoAsignacion"],
      ["TipoAsignacion"]
    );

    return NextResponse.json({
      softwareCatalogo,
      tiposSoftware,
      proveedores,
      tiposLicencia,
      estadosLicencia,
      tiposAsignacion,
    });
  } catch (error) {
    console.error("Error en GET /api/software/importar/catalogos:", error);
    return NextResponse.json(
      { error: "Error al obtener catálogos de importación de software" },
      { status: 500 }
    );
  }
}
