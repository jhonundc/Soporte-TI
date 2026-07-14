import { NextResponse } from "next/server";
import { executeQuery, executeTransactionQuery, getPool, sql } from "@/lib/db";
import { authSession, guardFailed } from "@/lib/auth/guards";
import {
  fichaCreateApiSchema,
  fichaDeleteQuerySchema,
  fichaListQuerySchema,
  fichaUpdateApiSchema,
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

function toNullableString(value: any): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function parseBooleanLike(value: any): boolean | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;
  const text = String(value).toLowerCase();
  if (text === "1" || text === "true" || text === "yes") return true;
  if (text === "0" || text === "false" || text === "no") return false;
  return null;
}

async function enrichFichas(baseRows: any[]) {
  if (!baseRows || baseRows.length === 0) return [];

  const bienIds = Array.from(new Set(baseRows.map((r: any) => parseNullableInt(r.IdBien)).filter((v) => v !== null))) as number[];
  const condicionIds = Array.from(new Set(baseRows.map((r: any) => parseNullableInt(r.IdCondicion)).filter((v) => v !== null))) as number[];
  const estadoIds = Array.from(new Set(baseRows.map((r: any) => parseNullableInt(r.IdEstadoBien)).filter((v) => v !== null))) as number[];
  const prioridadIds = Array.from(new Set(baseRows.map((r: any) => parseNullableInt(r.IdPrioridad)).filter((v) => v !== null))) as number[];
  const usuarioIds = Array.from(new Set(baseRows.map((r: any) => parseNullableInt(r.IdUsuarioSoporte)).filter((v) => v !== null))) as number[];

  const bienesResult = bienIds.length
    ? await executeQuery(`SELECT IdBien, CodigoInventario, CodigoPatrimonial, Descripcion, NumeroSerie, IdMarca, IdArea, IdCondicion, IdEstadoBien, Modelo, Activo FROM Bienes WHERE IdBien IN (${bienIds.join(",")})`)
    : { recordset: [] };

  const marcasIds = Array.from(new Set((bienesResult.recordset || []).map((b: any) => parseNullableInt(b.IdMarca)).filter((v) => v !== null))) as number[];
  const areasIds = Array.from(new Set((bienesResult.recordset || []).map((b: any) => parseNullableInt(b.IdArea)).filter((v) => v !== null))) as number[];
  const bienCondicionIds = Array.from(new Set((bienesResult.recordset || []).map((b: any) => parseNullableInt(b.IdCondicion)).filter((v) => v !== null))) as number[];
  const bienEstadoIds = Array.from(new Set((bienesResult.recordset || []).map((b: any) => parseNullableInt(b.IdEstadoBien)).filter((v) => v !== null))) as number[];

  const [marcasResult, areasResult, condicionesResult, estadosResult, prioridadesResult, usuariosResult] = await Promise.all([
    marcasIds.length ? executeQuery(`SELECT IdMarca, Marca, Activo FROM Marcas WHERE IdMarca IN (${marcasIds.join(",")})`) : Promise.resolve({ recordset: [] }),
    areasIds.length ? executeQuery(`SELECT IdArea, NombreArea, Piso, Referencia, Activo FROM Areas WHERE IdArea IN (${areasIds.join(",")})`) : Promise.resolve({ recordset: [] }),
    (new Set([...condicionIds, ...bienCondicionIds])).size
      ? executeQuery(`SELECT IdCondicion, Condicion, Activo FROM CondicionesBien WHERE IdCondicion IN (${Array.from(new Set([...condicionIds, ...bienCondicionIds])).join(",")})`)
      : Promise.resolve({ recordset: [] }),
    (new Set([...estadoIds, ...bienEstadoIds])).size
      ? executeQuery(`SELECT IdEstadoBien, EstadoBien, Activo FROM EstadosDelBien WHERE IdEstadoBien IN (${Array.from(new Set([...estadoIds, ...bienEstadoIds])).join(",")})`)
      : Promise.resolve({ recordset: [] }),
    prioridadIds.length ? executeQuery(`SELECT * FROM Prioridades WHERE IdPrioridad IN (${prioridadIds.join(",")})`) : Promise.resolve({ recordset: [] }),
    usuarioIds.length ? executeQuery(`SELECT IdUsuario, Nombres, Usuario FROM Usuarios WHERE IdUsuario IN (${usuarioIds.join(",")})`) : Promise.resolve({ recordset: [] }),
  ]);

  const bienesMap = new Map((bienesResult.recordset || []).map((b: any) => [b.IdBien, b]));
  const marcasMap = new Map((marcasResult.recordset || []).map((m: any) => [m.IdMarca, m]));
  const areasMap = new Map((areasResult.recordset || []).map((a: any) => [a.IdArea, a]));
  const condicionesMap = new Map((condicionesResult.recordset || []).map((c: any) => [c.IdCondicion, c]));
  const estadosMap = new Map((estadosResult.recordset || []).map((e: any) => [e.IdEstadoBien, e]));
  const prioridadesMap = new Map((prioridadesResult.recordset || []).map((p: any) => [p.IdPrioridad, p]));
  const usuariosMap = new Map((usuariosResult.recordset || []).map((u: any) => [u.IdUsuario, u]));

  return baseRows.map((row: any) => {
    const bien = row.IdBien ? bienesMap.get(row.IdBien) : null;
    const marca = bien?.IdMarca ? marcasMap.get(bien.IdMarca) : null;
    const area = bien?.IdArea ? areasMap.get(bien.IdArea) : null;
    const bienCondicion = bien?.IdCondicion ? condicionesMap.get(bien.IdCondicion) : null;
    const bienEstado = bien?.IdEstadoBien ? estadosMap.get(bien.IdEstadoBien) : null;
    const condicion = row.IdCondicion ? condicionesMap.get(row.IdCondicion) : null;
    const estado = row.IdEstadoBien ? estadosMap.get(row.IdEstadoBien) : null;
    const prioridad = row.IdPrioridad ? prioridadesMap.get(row.IdPrioridad) : null;
    const usuario = row.IdUsuarioSoporte ? usuariosMap.get(row.IdUsuarioSoporte) : null;

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
      EstadoAprobacion: row.EstadoAprobacion,
      Siglas: row.Siglas,
      FirmaSoporte: row.FirmaSoporte,
      FirmaJefeUnidad: row.FirmaJefeUnidad,
      FirmaAreaUsuario: row.FirmaAreaUsuario,
      IdUsuarioSoporte: row.IdUsuarioSoporte,
      FechaRegistro: row.FechaRegistro,
      Bien: bien
        ? {
            IdBien: bien.IdBien,
            CodigoInventario: bien.CodigoInventario,
            CodigoPatrimonial: bien.CodigoPatrimonial,
            Descripcion: bien.Descripcion,
            NumeroSerie: bien.NumeroSerie,
            IdMarca: bien.IdMarca,
            IdArea: bien.IdArea,
            IdCondicion: bien.IdCondicion,
            IdEstadoBien: bien.IdEstadoBien,
            Modelo: bien.Modelo ? { Modelo: bien.Modelo } : null,
            Activo: bien.Activo,
            Marca: marca ? { IdMarca: marca.IdMarca, Marca: marca.Marca, Activo: marca.Activo } : null,
            Area: area
              ? {
                  IdArea: area.IdArea,
                  NombreArea: area.NombreArea,
                  Piso: area.Piso,
                  Referencia: area.Referencia,
                  Activo: area.Activo,
                }
              : null,
            Condicion: bienCondicion
              ? {
                  IdCondicion: bienCondicion.IdCondicion,
                  Condicion: bienCondicion.Condicion,
                  Activo: bienCondicion.Activo,
                }
              : null,
            Estado: bienEstado
              ? {
                  IdEstadoBien: bienEstado.IdEstadoBien,
                  EstadoBien: bienEstado.EstadoBien,
                  Activo: bienEstado.Activo,
                }
              : null,
          }
        : null,
      Condicion: condicion
        ? {
            IdCondicion: condicion.IdCondicion,
            Condicion: condicion.Condicion,
            Activo: condicion.Activo,
          }
        : null,
      Estado: estado
        ? {
            IdEstadoBien: estado.IdEstadoBien,
            EstadoBien: estado.EstadoBien,
            Activo: estado.Activo,
          }
        : null,
      Prioridad: prioridad
        ? {
            IdPrioridad: prioridad.IdPrioridad,
            NombrePrioridad: prioridad.NombrePrioridad || prioridad.Prioridad || null,
            Activo: prioridad.Activo,
          }
        : null,
      UsuarioSoporte: usuario
        ? {
            Nombres: usuario.Nombres,
            Usuario: usuario.Usuario,
          }
        : null,
    };
  });
}

// Obtener todas las fichas de soporte
export async function GET(request: Request) {
  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const session = auth as any;
    const { searchParams } = new URL(request.url);
    const queryParsed = parseSearchParams(fichaListQuerySchema, searchParams);
    if ("error" in queryParsed) return queryParsed.error;

    const q = queryParsed.data;
    const idSoporte = q.id;
    const numeroFicha = q.numeroFicha;
    const idBien = q.idBien;
    const responsable = q.responsable;
    const dependencia = q.dependencia;
    const ambiente = q.ambiente;
    const idPrioridad = q.idPrioridad;
    const estadoTicket = q.estadoTicket;
    const idUsuarioSoporte = q.idUsuarioSoporte;
    const abiertos = q.abiertos;
    const cerrados = q.cerrados;

    let accion = "L";
    if (idSoporte) accion = "I";
    else if (numeroFicha) accion = "F";
    else if (idBien) accion = "B";
    else if (responsable) accion = "R";
    else if (dependencia) accion = "D";
    else if (ambiente) accion = "A";
    else if (idPrioridad) accion = "P";
    else if (estadoTicket) accion = "E";
    else if (idUsuarioSoporte) accion = "U";
    else if (abiertos) accion = "O";
    else if (cerrados) accion = "C";

    // If the current user is a soporte role, and no explicit idUsuarioSoporte filter was provided,
    // limit results to fichas created by this soporte (session.id)
    let queryParams = {
      Accion: accion,
      IdSoporte: idSoporte,
      NumeroFicha: numeroFicha,
      IdBien: idBien,
      Responsable: responsable,
      Dependencia: dependencia,
      Ambiente: ambiente,
      IdPrioridad: idPrioridad,
      EstadoTicket: estadoTicket,
      IdUsuarioSoporte: idUsuarioSoporte,
    } as any;

    const role = (session.role || "").toLowerCase();
    const isSoporte = role.includes("soporte");
    const isReportesRequest = searchParams.get("reportes") === "1";
    if (isSoporte && !idUsuarioSoporte && !isReportesRequest) {
      queryParams.IdUsuarioSoporte = session.id;
    }

    const result = await executeQuery(
      `EXEC sp_ConsultaSoporte
         @Accion = @Accion,
         @IdSoporte = @IdSoporte,
         @NumeroFicha = @NumeroFicha,
         @IdBien = @IdBien,
         @Responsable = @Responsable,
         @Dependencia = @Dependencia,
         @Ambiente = @Ambiente,
         @IdPrioridad = @IdPrioridad,
         @EstadoTicket = @EstadoTicket,
         @IdUsuarioSoporte = @IdUsuarioSoporte`,
      queryParams
    );

    let fichas = await enrichFichas(result.recordset || []);

    if (isSoporte && !isReportesRequest) {
      fichas = fichas.filter((ficha) => ficha.IdUsuarioSoporte === session.id);
    }

    if (idSoporte) {
      return NextResponse.json(fichas[0] || null);
    }

    return NextResponse.json(fichas);
  } catch (error) {
    console.error("Error en GET /api/soporte/ficha:", error);
    return NextResponse.json(
      { error: "Error al obtener las fichas de soporte" },
      { status: 500 }
    );
  }
}

async function findAdminDestinationId(transaction: sql.Transaction) {
  const result = await executeTransactionQuery(
    transaction,
    `SELECT TOP 1 u.IdUsuario
       FROM Usuarios u
       INNER JOIN Roles r ON u.IdRol = r.IdRol
       WHERE u.Activo = 1
         AND LOWER(r.NombreRol) LIKE '%admin%'
       ORDER BY u.IdUsuario ASC`
  );
  return result.recordset?.[0]?.IdUsuario ?? null;
}

// Crear una nueva ficha de soporte
export async function POST(request: Request) {
  let transaction: sql.Transaction | null = null;

  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const session = auth as any;

    const parsed = await parseJsonBody(fichaCreateApiSchema, request);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    const params: any = {
      Accion: "R",
      NumeroFicha: data.NumeroFicha,
      UnidadOrganica: data.UnidadOrganica || "UNIDAD DE ESTADISTICA E INFORMATICA",
      IdBien: data.IdBien,
      Responsable: data.Responsable,
      Dependencia: data.Dependencia,
      Ambiente: data.Ambiente,
      TipoBien: data.TipoBien,
      IdCondicion: data.IdCondicion,
      IdEstadoBien: data.IdEstadoBien,
      TrabajosRealizados: data.TrabajosRealizados,
      Diagnostico: data.Diagnostico,
      Recomendacion: data.Recomendacion,
      IdPrioridad: data.IdPrioridad,
      EstadoTicket: data.EstadoTicket || "Pendiente",
      Siglas: data.Siglas,
      FirmaSoporte: data.FirmaSoporte,
      FirmaJefeUnidad: data.FirmaJefeUnidad,
      FirmaAreaUsuario: data.FirmaAreaUsuario,
      IdUsuarioSoporte: data.IdUsuarioSoporte,
    };

    // If the creator is a soporte user and IdUsuarioSoporte not provided, set to session.id
    const role = (session.role || "").toLowerCase();
    const isSoporte = role.includes("soporte");
    if (isSoporte && !params.IdUsuarioSoporte) {
      params.IdUsuarioSoporte = session.id;
    }

    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    await executeTransactionQuery(
      transaction,
      `EXEC sp_MantenimientoSoporte
         @Accion = @Accion,
         @NumeroFicha = @NumeroFicha,
         @UnidadOrganica = @UnidadOrganica,
         @IdBien = @IdBien,
         @Responsable = @Responsable,
         @Dependencia = @Dependencia,
         @Ambiente = @Ambiente,
         @TipoBien = @TipoBien,
         @IdCondicion = @IdCondicion,
         @IdEstadoBien = @IdEstadoBien,
         @TrabajosRealizados = @TrabajosRealizados,
         @Diagnostico = @Diagnostico,
         @Recomendacion = @Recomendacion,
         @IdPrioridad = @IdPrioridad,
         @EstadoTicket = @EstadoTicket,
         @Siglas = @Siglas,
         @FirmaSoporte = @FirmaSoporte,
         @FirmaJefeUnidad = @FirmaJefeUnidad,
         @FirmaAreaUsuario = @FirmaAreaUsuario,
         @IdUsuarioSoporte = @IdUsuarioSoporte`,
      params
    );

    await syncBienState(transaction, params);

    const createdResult = await executeTransactionQuery(
      transaction,
      `EXEC sp_ConsultaSoporte @Accion = @Accion, @NumeroFicha = @NumeroFicha`,
      { Accion: "F", NumeroFicha: data.NumeroFicha }
    );
    const createdRows = await enrichFichas(createdResult.recordset || []);
    const createdSupport = createdRows[0];

    if (!createdSupport || !createdSupport.IdSoporte) {
      throw new Error("No se pudo obtener la ficha creada");
    }

    const adminDestinationId = await findAdminDestinationId(transaction);
    if (!adminDestinationId) {
      throw new Error("No se encontró un administrador destino para la notificación.");
    }

    const originUserId = parseInt(String(session.id), 10);

    await executeTransactionQuery(
      transaction,
      `EXEC sp_MantenimientoNotificacion
         @Accion = @Accion,
         @IdNotificacion = @IdNotificacion,
         @TipoFicha = @TipoFicha,
         @IdReferencia = @IdReferencia,
         @IdUsuarioOrigen = @IdUsuarioOrigen,
         @IdUsuarioDestino = @IdUsuarioDestino,
         @Titulo = @Titulo,
         @Mensaje = @Mensaje,
         @ObservacionAdministrador = @ObservacionAdministrador`,
      {
        Accion: "R",
        IdNotificacion: null,
        TipoFicha: "SOPORTE",
        IdReferencia: createdSupport.IdSoporte,
        IdUsuarioOrigen: originUserId,
        IdUsuarioDestino: adminDestinationId,
        Titulo: `Nueva ficha de soporte ${createdSupport.NumeroFicha}`,
        Mensaje: `Se ha registrado una nueva ficha de soporte con número ${createdSupport.NumeroFicha}.`,
        ObservacionAdministrador: null,
      }
    );

    const notificationResult = await executeTransactionQuery(
      transaction,
      `SELECT TOP 1 IdNotificacion
         FROM Notificaciones
         WHERE TipoFicha = @TipoFicha
           AND IdReferencia = @IdReferencia
           AND IdUsuarioOrigen = @IdUsuarioOrigen
           AND Activo = 1
         ORDER BY FechaCreacion DESC`,
      {
        TipoFicha: "SOPORTE",
        IdReferencia: createdSupport.IdSoporte,
        IdUsuarioOrigen: originUserId,
      }
    );

    await transaction.commit();

    const notificationId = notificationResult.recordset?.[0]?.IdNotificacion ?? null;
    return NextResponse.json(
      {
        ...createdSupport,
        IdNotificacion: notificationId,
        IdUsuarioDestino: adminDestinationId,
      },
      { status: 201 }
    );
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error al revertir transacción:", rollbackError);
      }
    }
    console.error("Error en POST /api/soporte/ficha:", error);
    return NextResponse.json(
      { error: "Error al crear la ficha de soporte" },
      { status: 500 }
    );
  }
}

// Actualizar una ficha de soporte
export async function PATCH(request: Request) {
  let transaction: sql.Transaction | null = null;

  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const session = auth as any;

    const parsed = await parseJsonBody(fichaUpdateApiSchema, request);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;
    const id = data.IdSoporte;

    let accion = "A";
    if (typeof data.Accion === "string" && ["A", "C", "P", "E"].includes(data.Accion)) {
      accion = data.Accion;
    } else if (data.Cerrar === true) {
      accion = "C";
    } else if (
      Object.keys(data).every((k) => ["IdSoporte", "IdPrioridad"].includes(k)) &&
      data.IdPrioridad !== undefined
    ) {
      accion = "P";
    } else if (
      Object.keys(data).every((k) => ["IdSoporte", "EstadoTicket"].includes(k)) &&
      data.EstadoTicket !== undefined
    ) {
      accion = "E";
    }

    const existingResult = await executeQuery(
      "EXEC sp_ConsultaSoporte @Accion = @Accion, @IdSoporte = @IdSoporte",
      { Accion: "I", IdSoporte: id }
    );
    const existingFicha = (existingResult.recordset || [])[0] as
      | { IdUsuarioSoporte?: number; NumeroFicha?: string }
      | undefined;

    if (!existingFicha) {
      return NextResponse.json({ error: "No se encontró la ficha de soporte." }, { status: 404 });
    }

    // If soporte user, ensure they own the ficha before allowing update
    const role = (session.role || "").toLowerCase();
    const isSoporte = role.includes("soporte");
    if (isSoporte) {
      if (existingFicha.IdUsuarioSoporte && existingFicha.IdUsuarioSoporte !== session.id) {
        return NextResponse.json({ error: "No tiene permisos para modificar esta ficha" }, { status: 403 });
      }
    }

    const params = {
      Accion: accion,
      IdSoporte: id,
      NumeroFicha: data.NumeroFicha,
      UnidadOrganica: data.UnidadOrganica || "UNIDAD DE ESTADISTICA E INFORMATICA",
      IdBien: data.IdBien,
      Responsable: data.Responsable,
      Dependencia: data.Dependencia,
      Ambiente: data.Ambiente,
      TipoBien: data.TipoBien,
      IdCondicion: data.IdCondicion,
      IdEstadoBien: data.IdEstadoBien,
      TrabajosRealizados: data.TrabajosRealizados,
      Diagnostico: data.Diagnostico,
      Recomendacion: data.Recomendacion,
      IdPrioridad: data.IdPrioridad,
      EstadoTicket: data.EstadoTicket || "Pendiente",
      Siglas: data.Siglas,
      FirmaSoporte: data.FirmaSoporte,
      FirmaJefeUnidad: data.FirmaJefeUnidad,
      FirmaAreaUsuario: data.FirmaAreaUsuario,
      IdUsuarioSoporte: data.IdUsuarioSoporte,
    };

    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    await executeTransactionQuery(
      transaction,
      `EXEC sp_MantenimientoSoporte
         @Accion = @Accion,
         @IdSoporte = @IdSoporte,
         @NumeroFicha = @NumeroFicha,
         @UnidadOrganica = @UnidadOrganica,
         @IdBien = @IdBien,
         @Responsable = @Responsable,
         @Dependencia = @Dependencia,
         @Ambiente = @Ambiente,
         @TipoBien = @TipoBien,
         @IdCondicion = @IdCondicion,
         @IdEstadoBien = @IdEstadoBien,
         @TrabajosRealizados = @TrabajosRealizados,
         @Diagnostico = @Diagnostico,
         @Recomendacion = @Recomendacion,
         @IdPrioridad = @IdPrioridad,
         @EstadoTicket = @EstadoTicket,
         @Siglas = @Siglas,
         @FirmaSoporte = @FirmaSoporte,
         @FirmaJefeUnidad = @FirmaJefeUnidad,
         @FirmaAreaUsuario = @FirmaAreaUsuario,
         @IdUsuarioSoporte = @IdUsuarioSoporte`,
      params
    );

    if (accion === "A") {
      await syncBienState(transaction, params);

      await executeTransactionQuery(
        transaction,
        `UPDATE dbo.SoporteTecnico
         SET EstadoAprobacion = 'PENDIENTE'
         WHERE IdSoporte = @IdSoporte`,
        { IdSoporte: id }
      );

      const pendingNotificationResult = await executeTransactionQuery<{ IdNotificacion: number }>(
        transaction,
        `SELECT TOP 1 IdNotificacion
         FROM dbo.Notificaciones
         WHERE TipoFicha = 'SOPORTE'
           AND IdReferencia = @IdReferencia
           AND EstadoAprobacion = 'PENDIENTE'
           AND Activo = 1`,
        { IdReferencia: id }
      );

      if (!pendingNotificationResult.recordset?.[0]) {
        const adminDestinationId = await findAdminDestinationId(transaction);
        const originUserId = parseNullableInt(existingFicha.IdUsuarioSoporte);

        if (!adminDestinationId || !originUserId) {
          throw new Error("No se pudo determinar el origen o destino de la nueva notificación.");
        }

        const numeroFicha = data.NumeroFicha || existingFicha.NumeroFicha || String(id);
        await executeTransactionQuery(
          transaction,
          `EXEC dbo.sp_MantenimientoNotificacion
             @Accion = @Accion,
             @IdNotificacion = @IdNotificacion,
             @TipoFicha = @TipoFicha,
             @IdReferencia = @IdReferencia,
             @IdUsuarioOrigen = @IdUsuarioOrigen,
             @IdUsuarioDestino = @IdUsuarioDestino,
             @Titulo = @Titulo,
             @Mensaje = @Mensaje,
             @ObservacionAdministrador = @ObservacionAdministrador`,
          {
            Accion: "R",
            IdNotificacion: null,
            TipoFicha: "SOPORTE",
            IdReferencia: id,
            IdUsuarioOrigen: originUserId,
            IdUsuarioDestino: adminDestinationId,
            Titulo: `Ficha de soporte actualizada ${numeroFicha}`,
            Mensaje: `Se ha actualizado la ficha de soporte ${numeroFicha} y requiere una nueva revisión.`,
            ObservacionAdministrador: null,
          }
        );
      }
    }

    await transaction.commit();
    transaction = null;

    const updatedResult = await executeQuery(
      `EXEC sp_ConsultaSoporte @Accion = @Accion, @IdSoporte = @IdSoporte`,
      { Accion: "I", IdSoporte: id }
    );
    const updatedRows = await enrichFichas(updatedResult.recordset || []);
    return NextResponse.json(updatedRows[0] || { success: true });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error al revertir la actualización de ficha:", rollbackError);
      }
    }
    console.error("Error en PATCH /api/soporte/ficha:", error);
    return NextResponse.json(
      { error: `Error al actualizar la ficha de soporte: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 }
    );
  }
}

// Eliminar una ficha de soporte
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseSearchParams(fichaDeleteQuerySchema, searchParams);
    if ("error" in parsed) return parsed.error;
    const id = parsed.data.id;

    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const session = auth as any;

    // If soporte user, ensure they own the ficha before allowing close
    const role = (session.role || "").toLowerCase();
    const isSoporte = role.includes("soporte");
    if (isSoporte) {
      const ownerRes = await executeQuery(`EXEC sp_ConsultaSoporte @Accion = @Accion, @IdSoporte = @IdSoporte`, { Accion: "I", IdSoporte: id });
      const ownerRow = (ownerRes.recordset || [])[0] || {};
      if (ownerRow.IdUsuarioSoporte && ownerRow.IdUsuarioSoporte !== session.id) {
        return NextResponse.json({ error: "No tiene permisos para cerrar esta ficha" }, { status: 403 });
      }
    }

    await executeQuery(
      `EXEC sp_MantenimientoSoporte
         @Accion = @Accion,
         @IdSoporte = @IdSoporte`,
      { Accion: "C", IdSoporte: id }
    );

    return NextResponse.json({ success: true, message: "Ticket cerrado exitosamente" });
  } catch (error) {
    console.error("Error en DELETE /api/soporte/ficha:", error);
    return NextResponse.json(
      { error: "Error al cerrar la ficha de soporte" },
      { status: 500 }
    );
  }
}


