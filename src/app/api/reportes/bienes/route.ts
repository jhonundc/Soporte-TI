import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

function parseNullableInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

async function enrichBienes(rows: any[]) {
  if (!rows.length) return rows;

  const bienIds = Array.from(
    new Set(rows.map((row: any) => parseNullableInt(String(row.IdBien ?? ""))).filter((id) => id !== null))
  ) as number[];

  if (!bienIds.length) return rows;

  const bienesResult = await executeQuery(
    `SELECT
      IdBien,
      CodigoInventario,
      CodigoPatrimonial,
      IdCategoria,
      IdMarca,
      IdArea,
      Modelo,
      NumeroSerie,
      Descripcion,
      IdCondicion,
      IdEstadoBien,
      FechaCompra,
      FechaRegistro,
      FechaModificacion,
      IdUsuarioRegistro,
      IdUsuarioModificacion,
      Activo
     FROM Bienes
     WHERE IdBien IN (${bienIds.join(",")})`
  );

  const baseRows = bienesResult.recordset || [];
  if (!baseRows.length) return rows;

  const marcasIds = Array.from(new Set(baseRows.map((r: any) => r.IdMarca).filter((v: any) => v !== null)));
  const areasIds = Array.from(new Set(baseRows.map((r: any) => r.IdArea).filter((v: any) => v !== null)));
  const condicionesIds = Array.from(new Set(baseRows.map((r: any) => r.IdCondicion).filter((v: any) => v !== null)));
  const estadosIds = Array.from(new Set(baseRows.map((r: any) => r.IdEstadoBien).filter((v: any) => v !== null)));
  const categoriasIds = Array.from(new Set(baseRows.map((r: any) => r.IdCategoria).filter((v: any) => v !== null)));

  const [marcasResult, areasResult, condicionesResult, estadosResult, categoriasResult] = await Promise.all([
    marcasIds.length ? executeQuery(`SELECT IdMarca, Marca, Activo FROM Marcas WHERE IdMarca IN (${marcasIds.join(",")})`) : Promise.resolve({ recordset: [] }),
    areasIds.length ? executeQuery(`SELECT IdArea, NombreArea, Piso, Referencia, Activo FROM Areas WHERE IdArea IN (${areasIds.join(",")})`) : Promise.resolve({ recordset: [] }),
    condicionesIds.length ? executeQuery(`SELECT IdCondicion, Condicion, Activo FROM CondicionesBien WHERE IdCondicion IN (${condicionesIds.join(",")})`) : Promise.resolve({ recordset: [] }),
    estadosIds.length ? executeQuery(`SELECT IdEstadoBien, EstadoBien, Activo FROM EstadosDelBien WHERE IdEstadoBien IN (${estadosIds.join(",")})`) : Promise.resolve({ recordset: [] }),
    categoriasIds.length ? executeQuery(`SELECT IdCategoria, CategoriaBien, Activo FROM CategoriasBienes WHERE IdCategoria IN (${categoriasIds.join(",")})`) : Promise.resolve({ recordset: [] }),
  ]);

  const marcasMap = new Map((marcasResult.recordset || []).map((item: any) => [item.IdMarca, item]));
  const areasMap = new Map((areasResult.recordset || []).map((item: any) => [item.IdArea, item]));
  const condicionesMap = new Map((condicionesResult.recordset || []).map((item: any) => [item.IdCondicion, item]));
  const estadosMap = new Map((estadosResult.recordset || []).map((item: any) => [item.IdEstadoBien, item]));
  const categoriasMap = new Map((categoriasResult.recordset || []).map((item: any) => [item.IdCategoria, item]));
  const rawOrder = new Map(rows.map((row: any, index: number) => [row.IdBien, index]));

  return baseRows
    .map((row: any) => {
      const marca = row.IdMarca ? marcasMap.get(row.IdMarca) : null;
      const area = row.IdArea ? areasMap.get(row.IdArea) : null;
      const condicion = row.IdCondicion ? condicionesMap.get(row.IdCondicion) : null;
      const estado = row.IdEstadoBien ? estadosMap.get(row.IdEstadoBien) : null;
      const categoria = row.IdCategoria ? categoriasMap.get(row.IdCategoria) : null;

      return {
        IdBien: row.IdBien,
        CodigoInventario: row.CodigoInventario,
        CodigoPatrimonial: row.CodigoPatrimonial,
        IdCategoria: row.IdCategoria,
        IdMarca: row.IdMarca,
        IdArea: row.IdArea,
        Modelo: row.Modelo,
        NumeroSerie: row.NumeroSerie,
        Descripcion: row.Descripcion,
        IdCondicion: row.IdCondicion,
        IdEstadoBien: row.IdEstadoBien,
        FechaCompra: row.FechaCompra,
        FechaRegistro: row.FechaRegistro,
        FechaModificacion: row.FechaModificacion,
        IdUsuarioRegistro: row.IdUsuarioRegistro,
        IdUsuarioModificacion: row.IdUsuarioModificacion,
        Activo: row.Activo,
        Marca: marca ? { IdMarca: marca.IdMarca, Marca: marca.Marca, Activo: marca.Activo } : null,
        Area: area ? { IdArea: area.IdArea, NombreArea: area.NombreArea, Piso: area.Piso, Referencia: area.Referencia, Activo: area.Activo } : null,
        Condicion: condicion ? { IdCondicion: condicion.IdCondicion, Condicion: condicion.Condicion, Activo: condicion.Activo } : null,
        Estado: estado ? { IdEstadoBien: estado.IdEstadoBien, EstadoBien: estado.EstadoBien, Activo: estado.Activo } : null,
        Categoria: categoria ? { IdCategoria: categoria.IdCategoria, CategoriaBien: categoria.CategoriaBien, Activo: categoria.Activo } : null,
      };
    })
    .sort((left: any, right: any) => {
      const leftOrder = rawOrder.get(left.IdBien) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = rawOrder.get(right.IdBien) ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder;
    });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accion = (searchParams.get("accion") || "G").toUpperCase();
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("fechaFin");
    const idArea = parseNullableInt(searchParams.get("idArea"));
    const idCategoria = parseNullableInt(searchParams.get("idCategoria"));

    // Validar que la acción sea válida
    const acciones = ["G", "A", "C", "E", "F", "B", "M", "O", "D", "R"];
    if (!acciones.includes(accion)) {
      return NextResponse.json(
        { error: "Acción no válida. Use: G, A, C, E, F, B, M, O, D o R" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `EXEC sp_ReporteBien
        @Accion = @Accion,
        @FechaInicio = @FechaInicio,
        @FechaFin = @FechaFin,
        @IdArea = @IdArea,
        @IdCategoria = @IdCategoria`,
      {
        Accion: accion,
        FechaInicio: fechaInicio || null,
        FechaFin: fechaFin || null,
        IdArea: idArea,
        IdCategoria: idCategoria,
      }
    );

    const rawData = result.recordset || [];
    const data = ["B", "D", "R"].includes(accion) ? await enrichBienes(rawData) : rawData;

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
    M: "Cantidad de Bienes por Marca",
    O: "Cantidad de Bienes por Modelo",
    D: "Detalle General de Bienes Activos",
    R: "Detalle General según Rango de Fechas",
  };
  return descriptions[accion] || "Desconocido";
}
