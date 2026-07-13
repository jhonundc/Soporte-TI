import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

function parseAction(value: string | null): string {
  const accion = (value || "L").toUpperCase();
  const allowed = ["L", "I", "N", "T", "V", "P", "C", "E", "F", "A", "D"];
  return allowed.includes(accion) ? accion : "L";
}

function getAccionDescription(accion: string): string {
  const descriptions: Record<string, string> = {
    L: "Listado de software activos",
    I: "Buscar software por ID",
    N: "Buscar software por nombre",
    T: "Buscar software por tipo",
    V: "Buscar software por versión",
    P: "Buscar software por proveedor",
    C: "Buscar software por tipo de licencia",
    E: "Buscar software por estado de licencia",
    F: "Listado de software próximo a vencer",
    A: "Listado de todos los software",
    D: "Listado de software inactivos",
  };
  return descriptions[accion] || "Reporte de software";
}

function resolveQueryParams(accion: string, term: string | null) {
  const value = term?.trim() ? term.trim() : null;
  return {
    Accion: accion,
    IdSoftware: accion === "I" ? (value ? parseInt(value, 10) : null) : null,
    NombreSoftware: accion === "N" ? value : null,
    TipoSoftware: accion === "T" ? value : null,
    VersionSoftware: accion === "V" ? value : null,
    ProveedorEntidad: accion === "P" ? value : null,
    TipoLicencia: accion === "C" ? value : null,
    EstadoLicencia: accion === "E" ? value : null,
    PorVencer: accion === "F" ? true : null,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accion = parseAction(searchParams.get("accion"));
    const term = searchParams.get("term");

    const params = resolveQueryParams(accion, term);

    const result = await executeQuery(
      `EXEC sp_ConsultaSoftware
        @Accion = @Accion,
        @IdSoftware = @IdSoftware,
        @NombreSoftware = @NombreSoftware,
        @TipoSoftware = @TipoSoftware,
        @VersionSoftware = @VersionSoftware,
        @ProveedorEntidad = @ProveedorEntidad,
        @TipoLicencia = @TipoLicencia,
        @EstadoLicencia = @EstadoLicencia,
        @PorVencer = @PorVencer`,
      params
    );

    const rawData = result.recordset || [];

    return NextResponse.json({
      accion,
      descripcion: getAccionDescription(accion),
      datos: rawData,
    });
  } catch (error) {
    console.error("Error en GET /api/reportes/software:", error);
    return NextResponse.json(
      { error: "Error al obtener el reporte de software" },
      { status: 500 }
    );
  }
}
