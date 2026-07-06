import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accion = (searchParams.get("accion") || "G").toUpperCase();

    // Validar que la acción sea válida
    const acciones = ["G", "A", "C", "E", "F", "B"];
    if (!acciones.includes(accion)) {
      return NextResponse.json(
        { error: "Acción no válida. Use: G, A, C, E, F, o B" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `EXEC sp_ReporteBien @Accion = @Accion`,
      { Accion: accion }
    );

    const data = result.recordset || [];

    return NextResponse.json({
      accion,
      descripcion: getAccionDescription(accion),
      datos: data,
    });
  } catch (error) {
    console.error("Error en GET /api/reportes/bienes:", error);
    return NextResponse.json(
      { error: "Error al obtener el reporte de bienes" },
      { status: 500 }
    );
  }
}

function getAccionDescription(accion: string): string {
  const descriptions: Record<string, string> = {
    G: "Resumen General del Inventario",
    A: "Cantidad de Bienes por Área",
    C: "Cantidad de Bienes por Categoría",
    E: "Cantidad de Bienes por Estado",
    F: "Bienes Registrados por Fecha",
    B: "Bienes Dados de Baja",
  };
  return descriptions[accion] || "Desconocido";
}
