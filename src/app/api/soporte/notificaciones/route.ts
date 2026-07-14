import { NextResponse } from "next/server";
import { z } from "zod";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed, isAdminRole } from "@/lib/auth/guards";
import { parseJsonBody, requiredPositiveInt, nullableString } from "@/lib/validations/common";

type NotificacionConsulta = {
  IdNotificacion: number;
  TipoFicha: string;
  IdUsuarioOrigen: number;
  IdUsuarioRespondio: number | null;
  [key: string]: unknown;
};

type UsuarioRelacionado = {
  IdUsuario: number;
  Nombres: string;
};

const notificacionActionSchema = z
  .object({
    IdNotificacion: requiredPositiveInt,
    Accion: z.enum(["P", "X"]),
    ObservacionAdministrador: nullableString,
  })
  .refine(
    (value) => value.Accion !== "X" || typeof value.ObservacionAdministrador === "string",
    {
      message: "Debe ingresar el motivo del rechazo",
      path: ["ObservacionAdministrador"],
    }
  );

export async function GET(request: Request) {
  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const session = auth;
    const isAdmin = isAdminRole(session.role);
    const isSupport = session.role.trim().toLowerCase() === "soporte";

    if (!isAdmin && !isSupport) {
      return NextResponse.json(
        { error: "No tiene permisos para consultar las notificaciones de soporte." },
        { status: 403 }
      );
    }

    const requestedType = new URL(request.url).searchParams.get("tipoFicha")?.trim().toUpperCase();
    const tipoFicha = requestedType === "SOPORTE" || requestedType === "BAJA" ? requestedType : null;

    const params = {
      Accion: isAdmin ? (tipoFicha ? "T" : "L") : "O",
      IdNotificacion: null,
      TipoFicha: tipoFicha,
      EstadoAprobacion: null,
      IdUsuarioDestino: null,
      IdUsuarioOrigen: isSupport ? session.id : null,
    };

    const result = await executeQuery<NotificacionConsulta>(
      `EXEC sp_ConsultaNotificacion
         @Accion = @Accion,
         @IdNotificacion = @IdNotificacion,
         @TipoFicha = @TipoFicha,
         @EstadoAprobacion = @EstadoAprobacion,
         @IdUsuarioDestino = @IdUsuarioDestino,
         @IdUsuarioOrigen = @IdUsuarioOrigen`,
      params
    );

    const notifications = (result.recordset || []).filter((notification) =>
      !tipoFicha || notification.TipoFicha.trim().toUpperCase() === tipoFicha
    );

    const userIds = [
      ...new Set(
        notifications
          .flatMap((notification) => [notification.IdUsuarioOrigen, notification.IdUsuarioRespondio])
          .filter((id): id is number => typeof id === "number")
      ),
    ];

    const userNames = new Map<number, string>();
    await Promise.all(
      userIds.map(async (id) => {
        const usersResult = await executeQuery<UsuarioRelacionado>(
          "SELECT IdUsuario, Nombres FROM dbo.Usuarios WHERE IdUsuario = @IdUsuario",
          { IdUsuario: id }
        );
        const user = usersResult.recordset?.[0];
        if (user) userNames.set(id, user.Nombres);
      })
    );

    return NextResponse.json(
      notifications.map((notification) => ({
        ...notification,
        NombreUsuarioOrigen: userNames.get(notification.IdUsuarioOrigen) ?? null,
        NombreUsuarioRespondio:
          notification.IdUsuarioRespondio === null
            ? null
            : userNames.get(notification.IdUsuarioRespondio) ?? null,
      }))
    );
  } catch (error) {
    console.error("Error en GET /api/soporte/notificaciones:", error);
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await adminSession();
    if (guardFailed(auth)) return auth;
    const session = auth;

    const parsed = await parseJsonBody(notificacionActionSchema, request);
    if ("error" in parsed) return parsed.error;
    const { IdNotificacion, Accion, ObservacionAdministrador } = parsed.data;

    const notificationResult = await executeQuery<{ TipoFicha: string }>(
      "SELECT TipoFicha FROM dbo.Notificaciones WHERE IdNotificacion = @IdNotificacion",
      { IdNotificacion }
    );
    const tipoFicha = notificationResult.recordset?.[0]?.TipoFicha?.trim().toUpperCase();

    const result = await executeQuery(
      tipoFicha === "BAJA"
        ? `EXEC dbo.sp_MantenimientoNotificacionBaja
             @Accion = @Accion,
             @IdNotificacion = @IdNotificacion,
             @IdUsuarioAdministrador = @IdUsuarioAdministrador,
             @ObservacionAdministrador = @ObservacionAdministrador`
        : `EXEC dbo.sp_MantenimientoNotificacion
         @Accion = @Accion,
         @IdNotificacion = @IdNotificacion,
         @IdUsuarioAdministrador = @IdUsuarioAdministrador,
         @ObservacionAdministrador = @ObservacionAdministrador`,
      {
        Accion,
        IdNotificacion,
        IdUsuarioAdministrador: session.id,
        ObservacionAdministrador: Accion === "X" ? ObservacionAdministrador : null,
      }
    );

    const payload = result.recordset?.[0] || {
      Mensaje: Accion === "P" ? "Notificación aprobada" : "Notificación rechazada",
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error en PATCH /api/soporte/notificaciones:", error);
    const message =
      error instanceof Error ? error.message : "Error al procesar la acción de notificación";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
