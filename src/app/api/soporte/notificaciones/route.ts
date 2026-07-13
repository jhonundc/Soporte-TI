import { NextResponse } from "next/server";
import { z } from "zod";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";
import { parseJsonBody, requiredPositiveInt, nullableString } from "@/lib/validations/common";

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
    const session = auth as any;
    const { searchParams } = new URL(request.url);

    const params: any = {
      Accion: "T",
      IdNotificacion: null,
      TipoFicha: "SOPORTE",
      EstadoAprobacion: null,
      IdUsuarioDestino: null,
      IdUsuarioOrigen: null,
    };

    const result = await executeQuery(
      `EXEC sp_ConsultaNotificacion
         @Accion = @Accion,
         @IdNotificacion = @IdNotificacion,
         @TipoFicha = @TipoFicha,
         @EstadoAprobacion = @EstadoAprobacion,
         @IdUsuarioDestino = @IdUsuarioDestino,
         @IdUsuarioOrigen = @IdUsuarioOrigen`,
      params
    );

    const notifications = result.recordset || [];

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error en GET /api/soporte/notificaciones:", error);
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await adminSession();
    if (guardFailed(auth)) return auth;

    const parsed = await parseJsonBody(notificacionActionSchema, request);
    if ("error" in parsed) return parsed.error;
    const { IdNotificacion, Accion, ObservacionAdministrador } = parsed.data;

    const result = await executeQuery(
      `EXEC dbo.sp_MantenimientoNotificacion
         @Accion = @Accion,
         @IdNotificacion = @IdNotificacion,
         @ObservacionAdministrador = @ObservacionAdministrador`,
      {
        Accion,
        IdNotificacion,
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
