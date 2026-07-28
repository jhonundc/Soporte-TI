import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { fichaBuscarQuerySchema, parseSearchParams } from "@/lib/validations";
import { authSession, guardFailed } from "@/lib/auth/guards";

// Helper para mapear una fila plana de la base de datos al formato relacional estructurado
function mapFichaRow(row: any) {
  return {
    IdSoporte: row.IdSoporte,
    NumeroFicha: row.NumeroFicha,
    UnidadOrganica: row.UnidadOrganica,
    IdBien: row.IdBien,
    Responsable: row.Responsable,
    Dependencia: row.Dependencia,
    Ambiente: row.Ambiente,
    TipoBien: row.TipoBien,
    IdCondicion: row.IdCondicion,
    IdEstadoBien: row.IdEstadoBien,
    TrabajosRealizados: row.TrabajosRealizados,
    Diagnostico: row.Diagnostico,
    Recomendacion: row.Recomendacion,
    IdPrioridad: row.IdPrioridad,
    EstadoTicket: row.EstadoTicket,
    Siglas: row.Siglas,
    FirmaSoporte: row.FirmaSoporte,
    FirmaJefeUnidad: row.FirmaJefeUnidad,
    FirmaAreaUsuario: row.FirmaAreaUsuario,
    IdUsuarioSoporte: row.IdUsuarioSoporte,
    FechaRegistro: row.FechaRegistro,
    Bien: row.IdBien
      ? {
          IdBien: row.IdBien,
          CodigoInventario: row.Bien_CodigoInventario,
          CodigoPatrimonial: row.Bien_CodigoPatrimonial,
          Descripcion: row.Bien_Descripcion,
          NumeroSerie: row.Bien_NumeroSerie,
          IdMarca: row.Bien_IdMarca,
          IdModelo: row.Bien_IdModelo,
          IdArea: row.Bien_IdArea,
          IdCondicion: row.Bien_IdCondicion,
          IdEstadoBien: row.Bien_IdEstadoBien,
          Activo: row.Bien_Activo,
          Marca: row.Bien_IdMarca
            ? { IdMarca: row.Bien_IdMarca, Marca: row.Bien_Marca_Marca, Activo: row.Bien_Marca_Activo }
            : null,
          Modelo: row.Bien_IdModelo
            ? {
                IdModelo: row.Bien_IdModelo,
                Modelo: row.Bien_Modelo_Modelo,
                IdMarca: row.Bien_Modelo_IdMarca,
                IdCategoria: row.Bien_Modelo_IdCategoria,
                Activo: row.Bien_Modelo_Activo,
              }
            : null,
          Area: row.Bien_IdArea
            ? {
                IdArea: row.Bien_IdArea,
                NombreArea: row.Bien_Area_NombreArea,
                Piso: row.Bien_Area_Piso,
                Referencia: row.Bien_Area_Referencia,
                Activo: row.Bien_Area_Activo,
              }
            : null,
          Condicion: row.Bien_IdCondicion
            ? {
                IdCondicion: row.Bien_IdCondicion,
                Condicion: row.Bien_Condicion_Condicion,
                Activo: row.Bien_Condicion_Activo,
              }
            : null,
          Estado: row.Bien_IdEstadoBien
            ? {
                IdEstadoBien: row.Bien_IdEstadoBien,
                EstadoBien: row.Bien_Estado_EstadoBien,
                Activo: row.Bien_Estado_Activo,
              }
            : null,
        }
      : null,
    Condicion: row.IdCondicion
      ? {
          IdCondicion: row.IdCondicion,
          Condicion: row.Condicion_Condicion,
          Activo: row.Condicion_Activo,
        }
      : null,
    Estado: row.IdEstadoBien
      ? {
          IdEstadoBien: row.IdEstadoBien,
          EstadoBien: row.Estado_EstadoBien,
          Activo: row.Estado_Activo,
        }
      : null,
    Prioridad: row.IdPrioridad
      ? {
          IdPrioridad: row.IdPrioridad,
          Prioridad: row.Prioridad_Prioridad,
          Activo: row.Prioridad_Activo,
        }
      : null,
    UsuarioSoporte: row.IdUsuarioSoporte
      ? {
          Nombres: row.Usuario_Nombres,
          Usuario: row.Usuario_Usuario,
        }
      : null,
  };
}

// Buscar fichas por CodigoInventario, CodigoPatrimonial o NumeroSerie del bien asociado
export async function GET(request: Request) {
  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const session = auth as any;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (!q) {
      return NextResponse.json([]);
    }

    const parsed = parseSearchParams(fichaBuscarQuerySchema, searchParams);
    if ("error" in parsed) return parsed.error;
    const query = parsed.data.q;

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
          p.NombrePrioridad AS Prioridad_Prioridad, p.Activo AS Prioridad_Activo,
          u.Nombres AS Usuario_Nombres, u.Usuario AS Usuario_Usuario
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
      LEFT JOIN Usuarios u ON s.IdUsuarioSoporte = u.IdUsuario
      WHERE 
          b.CodigoInventario LIKE @Query OR
          b.CodigoPatrimonial LIKE @Query OR
          b.NumeroSerie LIKE @Query
      ORDER BY s.FechaRegistro DESC
    `;

    // If soporte user, limit search to their own fichas
    const role = (session.role || "").toLowerCase();
    const isSoporte = role.includes("soporte");
    const params: any = { Query: `%${query}%` };
    const whereAppend = isSoporte ? " AND s.IdUsuarioSoporte = @IdUsuarioSoporte" : "";
    if (isSoporte) params.IdUsuarioSoporte = session.id;

    const result = await executeQuery(queryText.replace("ORDER BY s.FechaRegistro DESC", `${whereAppend}\n      ORDER BY s.FechaRegistro DESC`), params);
    const fichas = result.recordset.map(mapFichaRow);

    return NextResponse.json(fichas);
  } catch (error) {
    console.error("Error en GET /api/soporte/ficha/buscar:", error);
    return NextResponse.json(
      { error: "Error al buscar fichas" },
      { status: 500 }
    );
  }
}

