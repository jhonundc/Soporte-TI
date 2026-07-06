import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import {
  bajaCreateApiSchema,
  bajaDeleteQuerySchema,
  bajaUpdateApiSchema,
  parseJsonBody,
  parseSearchParams,
} from "@/lib/validations";

function parseNullableInt(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

async function enrichBajas(baseRows: any[]) {
  if (!baseRows || baseRows.length === 0) return [];

  const bienIds = Array.from(new Set(baseRows.map((r: any) => parseNullableInt(r.IdBien)).filter((v) => v !== null))) as number[];
  const condicionIds = Array.from(new Set(baseRows.map((r: any) => parseNullableInt(r.IdCondicion)).filter((v) => v !== null))) as number[];
  const estadoIds = Array.from(new Set(baseRows.map((r: any) => parseNullableInt(r.IdEstadoBien)).filter((v) => v !== null))) as number[];
  const usuarioIds = Array.from(new Set(baseRows.map((r: any) => parseNullableInt(r.IdUsuarioRegistro)).filter((v) => v !== null))) as number[];

  const [bienesResult, condicionesResult, estadosResult, usuariosResult] = await Promise.all([
    bienIds.length ? executeQuery(`SELECT IdBien, CodigoInventario, CodigoPatrimonial, Descripcion, NumeroSerie, IdMarca, Modelo, Activo FROM Bienes WHERE IdBien IN (${bienIds.join(",")})`) : Promise.resolve({ recordset: [] }),
    condicionIds.length ? executeQuery(`SELECT IdCondicion, Condicion, Activo FROM CondicionesBien WHERE IdCondicion IN (${condicionIds.join(",")})`) : Promise.resolve({ recordset: [] }),
    estadoIds.length ? executeQuery(`SELECT IdEstadoBien, EstadoBien, Activo FROM EstadosDelBien WHERE IdEstadoBien IN (${estadoIds.join(",")})`) : Promise.resolve({ recordset: [] }),
    usuarioIds.length ? executeQuery(`SELECT IdUsuario, Nombres, Usuario FROM Usuarios WHERE IdUsuario IN (${usuarioIds.join(",")})`) : Promise.resolve({ recordset: [] }),
  ]);

  const bienesMap = new Map((bienesResult.recordset || []).map((b: any) => [b.IdBien, b]));
  const condicionesMap = new Map((condicionesResult.recordset || []).map((c: any) => [c.IdCondicion, c]));
  const estadosMap = new Map((estadosResult.recordset || []).map((e: any) => [e.IdEstadoBien, e]));
  const usuariosMap = new Map((usuariosResult.recordset || []).map((u: any) => [u.IdUsuario, u]));

  return baseRows.map((row: any) => {
    const bien = row.IdBien ? bienesMap.get(row.IdBien) : null;
    const condicion = row.IdCondicion ? condicionesMap.get(row.IdCondicion) : null;
    const estado = row.IdEstadoBien ? estadosMap.get(row.IdEstadoBien) : null;
    const usuario = row.IdUsuarioRegistro ? usuariosMap.get(row.IdUsuarioRegistro) : null;

    return {
      IdBaja: row.IdBaja,
      NumeroFichaBaja: row.NumeroFichaBaja,
      FechaRegistro: row.FechaRegistro,
      UnidadOrganica: row.UnidadOrganica,
      IdBien: row.IdBien,
      Responsable: row.Responsable,
      Dependencia: row.Dependencia,
      Ambiente: row.Ambiente,
      TipoBien: row.TipoBien,
      IdCondicion: row.IdCondicion,
      IdEstadoBien: row.IdEstadoBien,
      Fundamentacion: row.Fundamentacion,
      Recomendacion: row.Recomendacion,
      CausalBaja: row.CausalBaja,
      Observacion: row.Observacion,
      IdUsuarioRegistro: row.IdUsuarioRegistro,
      Bien: bien
        ? {
            IdBien: bien.IdBien,
            CodigoInventario: bien.CodigoInventario,
            CodigoPatrimonial: bien.CodigoPatrimonial,
            Descripcion: bien.Descripcion,
            NumeroSerie: bien.NumeroSerie,
            Marca: bien.IdMarca ? { IdMarca: bien.IdMarca } : null,
            Modelo: bien.Modelo ? { Modelo: bien.Modelo } : null,
            Activo: bien.Activo,
          }
        : null,
      Condicion: condicion
        ? { IdCondicion: condicion.IdCondicion, Condicion: condicion.Condicion, Activo: condicion.Activo }
        : null,
      Estado: estado
        ? { IdEstadoBien: estado.IdEstadoBien, EstadoBien: estado.EstadoBien, Activo: estado.Activo }
        : null,
      UsuarioRegistro: usuario
        ? { Nombres: usuario.Nombres, Usuario: usuario.Usuario }
        : null,
    };
  });
}

// Obtener todas las fichas de baja
export async function GET() {
  try {
    const result = await executeQuery(`EXEC sp_ConsultaBajaBien @Accion = @Accion`, { Accion: "L" });
    const fichas = await enrichBajas(result.recordset || []);
    return NextResponse.json(fichas);
  } catch (error) {
    console.error("Error en GET /api/soporte/baja:", error);
    return NextResponse.json(
      { error: "Error al obtener las fichas de baja" },
      { status: 500 }
    );
  }
}

// Crear una nueva ficha de baja
export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(bajaCreateApiSchema, request);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    await executeQuery(
      `EXEC sp_MantenimientoBajaBien
         @Accion = @Accion,
         @NumeroFichaBaja = @NumeroFichaBaja,
         @UnidadOrganica = @UnidadOrganica,
         @IdBien = @IdBien,
         @Responsable = @Responsable,
         @Dependencia = @Dependencia,
         @Ambiente = @Ambiente,
         @TipoBien = @TipoBien,
         @IdCondicion = @IdCondicion,
         @IdEstadoBien = @IdEstadoBien,
         @Fundamentacion = @Fundamentacion,
         @Recomendacion = @Recomendacion,
         @CausalBaja = @CausalBaja,
         @Observacion = @Observacion,
         @IdUsuarioRegistro = @IdUsuarioRegistro`,
      {
        Accion: "R",
        NumeroFichaBaja: data.NumeroFichaBaja,
        UnidadOrganica: data.UnidadOrganica,
        IdBien: data.IdBien,
        Responsable: data.Responsable,
        Dependencia: data.Dependencia,
        Ambiente: data.Ambiente,
        TipoBien: data.TipoBien,
        IdCondicion: data.IdCondicion,
        IdEstadoBien: data.IdEstadoBien,
        Fundamentacion: data.Fundamentacion,
        Recomendacion: data.Recomendacion,
        CausalBaja: data.CausalBaja,
        Observacion: data.Observacion,
        IdUsuarioRegistro: data.IdUsuarioRegistro,
      }
    );

    const createdResult = await executeQuery(
      `EXEC sp_ConsultaBajaBien @Accion = @Accion, @NumeroFichaBaja = @NumeroFichaBaja`,
      { Accion: "F", NumeroFichaBaja: data.NumeroFichaBaja }
    );
    const createdRows = await enrichBajas(createdResult.recordset || []);
    return NextResponse.json(createdRows[0] || { success: true }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/soporte/baja:", error);
    return NextResponse.json(
      { error: "Error al crear la ficha de baja" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = await parseJsonBody(bajaUpdateApiSchema, request);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    await executeQuery(
      `EXEC sp_MantenimientoBajaBien
         @Accion = @Accion,
         @IdBaja = @IdBaja,
         @NumeroFichaBaja = @NumeroFichaBaja,
         @UnidadOrganica = @UnidadOrganica,
         @IdBien = @IdBien,
         @Responsable = @Responsable,
         @Dependencia = @Dependencia,
         @Ambiente = @Ambiente,
         @TipoBien = @TipoBien,
         @IdCondicion = @IdCondicion,
         @IdEstadoBien = @IdEstadoBien,
         @Fundamentacion = @Fundamentacion,
         @Recomendacion = @Recomendacion,
         @CausalBaja = @CausalBaja,
         @Observacion = @Observacion,
         @IdUsuarioRegistro = @IdUsuarioRegistro`,
      {
        Accion: "A",
        IdBaja: data.IdBaja,
        NumeroFichaBaja: data.NumeroFichaBaja,
        UnidadOrganica: data.UnidadOrganica,
        IdBien: data.IdBien,
        Responsable: data.Responsable,
        Dependencia: data.Dependencia,
        Ambiente: data.Ambiente,
        TipoBien: data.TipoBien,
        IdCondicion: data.IdCondicion,
        IdEstadoBien: data.IdEstadoBien,
        Fundamentacion: data.Fundamentacion,
        Recomendacion: data.Recomendacion,
        CausalBaja: data.CausalBaja,
        Observacion: data.Observacion,
        IdUsuarioRegistro: data.IdUsuarioRegistro,
      }
    );

    return NextResponse.json({ success: true, message: "Ficha de baja actualizada" });
  } catch (error) {
    console.error("Error en PATCH /api/soporte/baja:", error);
    return NextResponse.json({ error: "Error al actualizar la ficha de baja" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseSearchParams(bajaDeleteQuerySchema, searchParams);
    if ("error" in parsed) return parsed.error;
    const id = parsed.data.id;

    await executeQuery("DELETE FROM BajasBienes WHERE IdBaja = @IdBaja", { IdBaja: id });

    return NextResponse.json({ success: true, message: "Ficha de baja eliminada" });
  } catch (error) {
    console.error("Error en DELETE /api/soporte/baja:", error);
    return NextResponse.json({ error: "Error al eliminar la ficha de baja" }, { status: 500 });
  }
}

