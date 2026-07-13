import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

// Exportar fichas a formato CSV (Excel)
// Se puede filtrar por area, IdBien, o traer todas
export async function GET(request: Request) {
  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const session = auth as any;

    const { searchParams } = new URL(request.url);
    const idArea = searchParams.get("idArea");
    const idBien = searchParams.get("idBien");

    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (idArea) {
      conditions.push("b.IdArea = @IdArea");
      params.IdArea = parseInt(idArea);
    }
    if (idBien) {
      conditions.push("s.IdBien = @IdBien");
      params.IdBien = parseInt(idBien);
    }

    // If soporte user, and not admin, restrict export to their own fichas
    const role = (session.role || "").toLowerCase();
    const isSoporte = role.includes("soporte");
    if (isSoporte) {
      conditions.push("s.IdUsuarioSoporte = @IdUsuarioSoporte");
      params.IdUsuarioSoporte = session.id;
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const queryText = `
      SELECT 
          s.*,
          b.CodigoInventario AS Bien_CodigoInventario, b.CodigoPatrimonial AS Bien_CodigoPatrimonial, b.Descripcion AS Bien_Descripcion, b.NumeroSerie AS Bien_NumeroSerie, b.IdMarca AS Bien_IdMarca, b.IdModelo AS Bien_IdModelo, b.IdArea AS Bien_IdArea, b.IdCondicion AS Bien_IdCondicion, b.IdEstadoBien AS Bien_IdEstadoBien, b.Activo AS Bien_Activo,
          bm.Marca AS Bien_Marca_Marca, bm.Activo AS Bien_Marca_Activo,
          bmo.Modelo AS Bien_Modelo_Modelo, bmo.Activo AS Bien_Modelo_Activo, bmo.IdMarca AS Bien_Modelo_IdMarca, bmo.IdCategoria AS Bien_Modelo_IdCategoria,
          ba.NombreArea AS Bien_Area_NombreArea, ba.Piso AS Bien_Area_Piso, ba.Referencia AS Bien_Area_Referencia, ba.Activo AS Bien_Area_Activo,
          bc.Condicion AS Bien_Condicion_Condicion, bc.Activo AS Bien_Condicion_Activo,
          be.EstadoBien AS Bien_Estado_EstadoBien, be.Activo AS Bien_Estado_Activo,
          sc.Condicion AS Condicion_Condicion, sc.Activo AS Condicion_Activo,
          se.EstadoBien AS Estado_EstadoBien, se.Activo AS Estado_Activo,
          p.NombrePrioridad AS Prioridad_NombrePrioridad, p.Activo AS Prioridad_Activo
      FROM SoporteTecnico s
      LEFT JOIN Bienes b ON s.IdBien = b.IdBien
      LEFT JOIN Marcas bm ON b.IdMarca = bm.IdMarca
      LEFT JOIN Modelos bmo ON b.IdModelo = bmo.IdModelo
      LEFT JOIN Areas ba ON b.IdArea = ba.IdArea
      LEFT JOIN CondicionesBien bc ON b.IdCondicion = bc.IdCondicion
      LEFT JOIN EstadosDelBien be ON b.IdEstadoBien = be.IdEstadoBien
      LEFT JOIN CondicionesBien sc ON s.IdCondicion = sc.IdCondicion
      LEFT JOIN EstadosDelBien se ON s.IdEstadoBien = se.IdEstadoBien
      LEFT JOIN Prioridades p ON s.IdPrioridad = p.IdPrioridad
      ${whereClause}
      ORDER BY s.FechaRegistro DESC
    `;

    const result = await executeQuery(queryText, params);
    
    const fichas = result.recordset.map((row: any) => ({
      NumeroFicha: row.NumeroFicha,
      UnidadOrganica: row.UnidadOrganica,
      FechaRegistro: row.FechaRegistro,
      Responsable: row.Responsable,
      Dependencia: row.Dependencia,
      Ambiente: row.Ambiente,
      TipoBien: row.TipoBien,
      TrabajosRealizados: row.TrabajosRealizados,
      Diagnostico: row.Diagnostico,
      Recomendacion: row.Recomendacion,
      Siglas: row.Siglas,
      FirmaSoporte: row.FirmaSoporte,
      FirmaJefeUnidad: row.FirmaJefeUnidad,
      FirmaAreaUsuario: row.FirmaAreaUsuario,
      EstadoTicket: row.EstadoTicket,
      Bien: row.IdBien ? {
        CodigoInventario: row.Bien_CodigoInventario,
        CodigoPatrimonial: row.Bien_CodigoPatrimonial,
        Descripcion: row.Bien_Descripcion,
        NumeroSerie: row.Bien_NumeroSerie,
        Marca: row.Bien_IdMarca ? { Marca: row.Bien_Marca_Marca } : null,
        Modelo: row.Bien_IdModelo ? { Modelo: row.Bien_Modelo_Modelo } : null,
      } : null,
      Condicion: row.IdCondicion ? { Condicion: row.Condicion_Condicion } : null,
      Estado: row.IdEstadoBien ? { EstadoBien: row.Estado_EstadoBien } : null,
      Prioridad: row.IdPrioridad ? { NombrePrioridad: row.Prioridad_NombrePrioridad } : null,
    }));

    // Build CSV rows
    const headers = [
      "Nº Ficha",
      "Unidad Orgánica",
      "Fecha Registro",
      "Cod. Inventario",
      "Cod. Patrimonial",
      "Bien",
      "Marca",
      "Modelo",
      "Nº Serie",
      "Responsable",
      "Dependencia",
      "Ambiente",
      "Tipo Bien",
      "Condición",
      "Estado",
      "Trabajos Realizados",
      "Diagnóstico",
      "Recomendación",
      "Prioridad",
      "Siglas",
      "Firma Soporte",
      "Firma Jefe Unidad",
      "Firma Área Usuario",
      "Estado Ticket",
    ];

    const rows = fichas.map((f: any) => [
      f.NumeroFicha ?? "",
      f.UnidadOrganica ?? "",
      f.FechaRegistro
        ? new Date(f.FechaRegistro).toLocaleString("es-PE")
        : "",
      f.Bien?.CodigoInventario ?? "",
      f.Bien?.CodigoPatrimonial ?? "",
      f.Bien?.Descripcion ?? "",
      f.Bien?.Marca?.Marca ?? "",
      f.Bien?.Modelo?.Modelo ?? "",
      f.Bien?.NumeroSerie ?? "",
      f.Responsable ?? "",
      f.Dependencia ?? "",
      f.Ambiente ?? "",
      f.TipoBien ?? "",
      f.Condicion?.Condicion ?? "",
      f.Estado?.EstadoBien ?? "",
      f.TrabajosRealizados ?? "",
      f.Diagnostico ?? "",
      f.Recomendacion ?? "",
      f.Prioridad?.NombrePrioridad ?? "",
      f.Siglas ?? "",
      f.FirmaSoporte ?? "",
      f.FirmaJefeUnidad ?? "",
      f.FirmaAreaUsuario ?? "",
      f.EstadoTicket ?? "",
    ]);

    const csvContent = [
      headers.join("\t"),
      ...rows.map((r: any) => r.join("\t")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(blob);
        controller.close();
      },
    });

    const now = new Date();
    const filename = `fichas_soporte_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.csv`;

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/soporte/ficha/exportar:", error);
    return NextResponse.json(
      { error: "Error al exportar fichas" },
      { status: 500 }
    );
  }
}

