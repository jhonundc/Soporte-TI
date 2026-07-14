import { NextResponse } from "next/server";
import { executeQuery, executeTransactionQuery, getPool, sql } from "@/lib/db";
import { authSession, guardFailed } from "@/lib/auth/guards";
import {
  bajaCreateApiSchema,
  bajaDeleteQuerySchema,
  bajaListQuerySchema,
  bajaUpdateApiSchema,
  parseJsonBody,
  parseSearchParams,
} from "@/lib/validations";

function parseNullableInt(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

async function syncBienState(
  transaction: sql.Transaction,
  data: { IdBien?: number | string | null; IdCondicion?: number | string | null; IdEstadoBien?: number | string | null }
) {
  const IdBien = parseNullableInt(data.IdBien);
  const IdCondicion = parseNullableInt(data.IdCondicion);
  const IdEstadoBien = parseNullableInt(data.IdEstadoBien);

  if (!IdBien || !IdCondicion || !IdEstadoBien) return;

  const result = await executeTransactionQuery<{ IdBien: number }>(
    transaction,
    `UPDATE dbo.Bienes
     SET IdCondicion = @IdCondicion,
         IdEstadoBien = @IdEstadoBien
     OUTPUT INSERTED.IdBien
     WHERE IdBien = @IdBien`,
    { IdBien, IdCondicion, IdEstadoBien }
  );

  if (!result.recordset?.[0]) {
    throw new Error("No se encontró el bien seleccionado para actualizar su condición y estado.");
  }
}

async function findAdminDestinationId(transaction: sql.Transaction) {
  const result = await executeTransactionQuery<{ IdUsuario: number }>(
    transaction,
    `SELECT TOP 1 u.IdUsuario
     FROM dbo.Usuarios u
     INNER JOIN dbo.Roles r ON r.IdRol = u.IdRol
     WHERE u.Activo = 1
       AND r.Activo = 1
       AND LOWER(LTRIM(RTRIM(r.NombreRol))) = 'admin'
     ORDER BY u.IdUsuario`
  );
  return result.recordset?.[0]?.IdUsuario ?? null;
}

async function createBajaNotification(
  transaction: sql.Transaction,
  data: { idBaja: number; numeroFicha: string; idUsuarioOrigen: number; actualizada?: boolean }
) {
  const adminDestinationId = await findAdminDestinationId(transaction);
  if (!adminDestinationId) {
    throw new Error("No se encontró un administrador destino para la notificación.");
  }

  await executeTransactionQuery(
    transaction,
    `EXEC dbo.sp_MantenimientoNotificacionBaja
       @Accion = @Accion,
       @IdReferencia = @IdReferencia,
       @IdUsuarioOrigen = @IdUsuarioOrigen,
       @IdUsuarioDestino = @IdUsuarioDestino,
       @Titulo = @Titulo,
       @Mensaje = @Mensaje`,
    {
      Accion: "R",
      IdReferencia: data.idBaja,
      IdUsuarioOrigen: data.idUsuarioOrigen,
      IdUsuarioDestino: adminDestinationId,
      Titulo: data.actualizada
        ? `Ficha de baja actualizada ${data.numeroFicha}`
        : `Nueva ficha de baja ${data.numeroFicha}`,
      Mensaje: data.actualizada
        ? `Se ha actualizado la ficha de baja ${data.numeroFicha} y requiere una nueva revisión.`
        : `Se ha registrado una nueva ficha de baja con número ${data.numeroFicha}.`,
    }
  );
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
      EstadoAprobacion: row.EstadoAprobacion,
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

// Obtener fichas de baja (lista o por número de ficha)
export async function GET(request: Request) {
  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const session = auth as any;

    const { searchParams } = new URL(request.url);
    const queryParsed = parseSearchParams(bajaListQuerySchema, searchParams);
    if ("error" in queryParsed) return queryParsed.error;

    const numeroFicha = queryParsed.data.numeroFicha;
    const accion = numeroFicha ? "F" : "L";

    const isReportesRequest = searchParams.get("reportes") === "1";
    const result = await executeQuery(
      `EXEC sp_ConsultaBajaBien
         @Accion = @Accion,
         @NumeroFichaBaja = @NumeroFichaBaja`,
      {
        Accion: accion,
        NumeroFichaBaja: numeroFicha ?? null,
      }
    );

    let fichas = await enrichBajas(result.recordset || []);
    const role = (session.role || "").toLowerCase();
    const isSoporte = role.includes("soporte");
    if (isSoporte && !isReportesRequest) {
      fichas = fichas.filter((ficha) => ficha.IdUsuarioRegistro === session.id);
    }

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
  let transaction: sql.Transaction | null = null;

  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const session = auth as any;

    const parsed = await parseJsonBody(bajaCreateApiSchema, request);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    const role = (session.role || "").toLowerCase();
    const isSoporte = role.includes("soporte");
    const idUsuarioRegistro = isSoporte ? session.id : data.IdUsuarioRegistro;

    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    await executeTransactionQuery(
      transaction,
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
        IdUsuarioRegistro: idUsuarioRegistro,
      }
    );

    await syncBienState(transaction, data);

    const createdIdResult = await executeTransactionQuery<{ IdBaja: number }>(
      transaction,
      `SELECT TOP 1 IdBaja
       FROM dbo.BajasBienes
       WHERE NumeroFichaBaja = @NumeroFichaBaja
       ORDER BY IdBaja DESC`,
      { NumeroFichaBaja: data.NumeroFichaBaja }
    );
    const createdId = createdIdResult.recordset?.[0]?.IdBaja;
    const originUserId = parseNullableInt(idUsuarioRegistro);
    if (!createdId || !originUserId) {
      throw new Error("No se pudo obtener la ficha de baja creada o su usuario de origen.");
    }

    await createBajaNotification(transaction, {
      idBaja: createdId,
      numeroFicha: data.NumeroFichaBaja,
      idUsuarioOrigen: originUserId,
    });

    await transaction.commit();
    transaction = null;

    const createdResult = await executeQuery(
      `EXEC sp_ConsultaBajaBien @Accion = @Accion, @NumeroFichaBaja = @NumeroFichaBaja`,
      { Accion: "F", NumeroFichaBaja: data.NumeroFichaBaja }
    );
    const createdRows = await enrichBajas(createdResult.recordset || []);
    return NextResponse.json(createdRows[0] || { success: true }, { status: 201 });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error al revertir la creación de ficha de baja:", rollbackError);
      }
    }
    console.error("Error en POST /api/soporte/baja:", error);
    return NextResponse.json(
      { error: "Error al crear la ficha de baja" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  let transaction: sql.Transaction | null = null;

  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const session = auth as any;

    const parsed = await parseJsonBody(bajaUpdateApiSchema, request);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    const existingResult = await executeQuery<{
      IdUsuarioRegistro: number | null;
      NumeroFichaBaja: string | null;
    }>(
      "SELECT IdUsuarioRegistro, NumeroFichaBaja FROM dbo.BajasBienes WHERE IdBaja = @IdBaja",
      { IdBaja: data.IdBaja }
    );
    const existingBaja = existingResult.recordset?.[0];
    if (!existingBaja) {
      return NextResponse.json({ error: "No se encontró la ficha de baja." }, { status: 404 });
    }

    const role = (session.role || "").toLowerCase();
    const isSoporte = role.includes("soporte");
    if (isSoporte) {
      if (existingBaja.IdUsuarioRegistro && existingBaja.IdUsuarioRegistro !== session.id) {
        return NextResponse.json({ error: "No tiene permisos para actualizar esta ficha de baja" }, { status: 403 });
      }
    }

    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    await executeTransactionQuery(
      transaction,
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

    await syncBienState(transaction, data);

    await executeTransactionQuery(
      transaction,
      "UPDATE dbo.BajasBienes SET EstadoAprobacion = 'PENDIENTE' WHERE IdBaja = @IdBaja",
      { IdBaja: data.IdBaja }
    );

    const pendingNotificationResult = await executeTransactionQuery<{ IdNotificacion: number }>(
      transaction,
      `SELECT TOP 1 IdNotificacion
       FROM dbo.Notificaciones
       WHERE TipoFicha = 'BAJA'
         AND IdReferencia = @IdReferencia
         AND EstadoAprobacion = 'PENDIENTE'
         AND Activo = 1`,
      { IdReferencia: data.IdBaja }
    );

    const originUserId = parseNullableInt(existingBaja.IdUsuarioRegistro);
    if (!pendingNotificationResult.recordset?.[0]) {
      if (!originUserId) {
        throw new Error("No se pudo determinar el usuario de origen de la ficha de baja.");
      }
      await createBajaNotification(transaction, {
        idBaja: data.IdBaja,
        numeroFicha: data.NumeroFichaBaja || existingBaja.NumeroFichaBaja || String(data.IdBaja),
        idUsuarioOrigen: originUserId,
        actualizada: true,
      });
    }

    await transaction.commit();
    transaction = null;

    return NextResponse.json({ success: true, message: "Ficha de baja actualizada" });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error al revertir la actualización de ficha de baja:", rollbackError);
      }
    }
    console.error("Error en PATCH /api/soporte/baja:", error);
    return NextResponse.json({ error: "Error al actualizar la ficha de baja" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const session = auth as any;

    const { searchParams } = new URL(request.url);
    const parsed = parseSearchParams(bajaDeleteQuerySchema, searchParams);
    if ("error" in parsed) return parsed.error;
    const id = parsed.data.id;

    const role = (session.role || "").toLowerCase();
    const isSoporte = role.includes("soporte");
    if (isSoporte) {
      const ownerRes = await executeQuery(
        "SELECT IdUsuarioRegistro FROM BajasBienes WHERE IdBaja = @IdBaja",
        { IdBaja: id }
      );
      const ownerRow = (ownerRes.recordset || [])[0] || {};
      if (ownerRow.IdUsuarioRegistro && ownerRow.IdUsuarioRegistro !== session.id) {
        return NextResponse.json({ error: "No tiene permisos para eliminar esta ficha de baja" }, { status: 403 });
      }
    }

    await executeQuery("DELETE FROM BajasBienes WHERE IdBaja = @IdBaja", { IdBaja: id });

    return NextResponse.json({ success: true, message: "Ficha de baja eliminada" });
  } catch (error) {
    console.error("Error en DELETE /api/soporte/baja:", error);
    return NextResponse.json({ error: "Error al eliminar la ficha de baja" }, { status: 500 });
  }
}

