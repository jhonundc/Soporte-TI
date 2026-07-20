import { NextResponse } from "next/server";
import { authSession, guardFailed, isAdminRole } from "@/lib/auth/guards";
import { executeQuery, getPool, sql } from "@/lib/db";

const message = (error: unknown) => error instanceof Error ? error.message : "Error al procesar el acta de entrega";
const integer = (value: unknown) => Number.isInteger(Number(value)) ? Number(value) : null;

export async function GET(request: Request) {
  const session = await authSession();
  if (guardFailed(session)) return session;
  try {
    const search = new URL(request.url).searchParams;
    if (search.get("siguienteNumero") === "1") {
      const result = await executeQuery<{ NumeroActa: number }>(`
        SELECT ISNULL(MAX(TRY_CONVERT(INT, NumeroActa)), 0) + 1 AS NumeroActa
        FROM dbo.ActasEntrega
      `);
      return NextResponse.json({ NumeroActa: String(result.recordset[0]?.NumeroActa || 1) });
    }
    const id = integer(search.get("id"));
    if (id) {
      const result = await executeQuery("EXEC dbo.sp_ConsultaActaEntrega @Accion = @Accion, @IdActaEntrega = @IdActaEntrega", { Accion: "I", IdActaEntrega: id });
      const recordsets = result.recordsets as unknown as Array<Array<Record<string, unknown>>>;
      const acta = recordsets?.[0]?.[0];
      if (!acta) return NextResponse.json({ error: "Acta no encontrada" }, { status: 404 });
      if (!isAdminRole(session.role) && Number(acta.IdUsuarioEntrega) !== session.id) {
        return NextResponse.json({ error: "No tiene permisos para consultar esta acta." }, { status: 403 });
      }
      return NextResponse.json({
        ...acta,
        NombreCreador: String(acta.UsuarioEntrega || "-"),
        Detalles: recordsets?.[1] || [],
      });
    }
    const accion = search.get("todas") === "1" ? "T" : "L";
    const result = await executeQuery("EXEC dbo.sp_ConsultaActaEntrega @Accion = @Accion", { Accion: accion });
    const visibleActas = isAdminRole(session.role)
      ? result.recordset || []
      : (result.recordset || []).filter(
          (acta: { IdUsuarioEntrega?: number }) => Number(acta.IdUsuarioEntrega) === session.id
        );
    const actas = visibleActas.map((acta: { UsuarioEntrega?: string }) => ({
      ...acta,
      NombreCreador: acta.UsuarioEntrega || "-",
    }));
    return NextResponse.json(actas);
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 500 });
  }
}

async function save(request: Request, accion: "R" | "A") {
  const session = await authSession();
  if (guardFailed(session)) return session;
  try {
    const body = await request.json();
    if (accion === "A" && !isAdminRole(session.role)) {
      const owner = await executeQuery<{ IdUsuarioEntrega: number }>(
        "SELECT IdUsuarioEntrega FROM dbo.ActasEntrega WHERE IdActaEntrega = @IdActaEntrega",
        { IdActaEntrega: integer(body.IdActaEntrega) }
      );
      if (Number(owner.recordset[0]?.IdUsuarioEntrega) !== session.id) {
        return NextResponse.json({ error: "No tiene permisos para modificar esta acta." }, { status: 403 });
      }
    }
    if (!String(body.NombreReceptor || "").trim())
      return NextResponse.json({ error: "El nombre del receptor es obligatorio." }, { status: 400 });
    if (accion === "A" && !String(body.NumeroActa || "").trim())
      return NextResponse.json({ error: "El acta no tiene un número válido." }, { status: 400 });
    if (!Array.isArray(body.Detalles) || body.Detalles.length === 0)
      return NextResponse.json({ error: "Agregue al menos un bien." }, { status: 400 });
    const idAreaReceptor = integer(body.IdAreaReceptor);
    if (!idAreaReceptor)
      return NextResponse.json({ error: "Seleccione el área receptora de los bienes." }, { status: 400 });
    const bienIds = body.Detalles.map((item: { IdBien?: unknown }) => integer(item.IdBien));
    if (bienIds.some((id: number | null) => id === null))
      return NextResponse.json({ error: "Uno o más bienes seleccionados no son válidos." }, { status: 400 });

    const detalles = new sql.Table("dbo.ActaEntregaDetalleType");
    detalles.columns.add("IdBien", sql.Int, { nullable: false });
    detalles.columns.add("ObservacionDetalle", sql.VarChar(500), { nullable: true });
    for (const item of body.Detalles) detalles.rows.add(integer(item.IdBien), String(item.ObservacionDetalle || "").trim() || null);

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    let numeroActa = String(body.NumeroActa || "").trim();
    try {
      if (accion === "R") {
        const correlativo = await transaction.request().query<{ NumeroActa: number }>(`
          SELECT ISNULL(MAX(TRY_CONVERT(INT, NumeroActa)), 0) + 1 AS NumeroActa
          FROM dbo.ActasEntrega WITH (UPDLOCK, HOLDLOCK)
        `);
        numeroActa = String(correlativo.recordset[0]?.NumeroActa || 1);
      }

    const dbRequest = transaction.request();
    dbRequest.input("Accion", sql.Char(1), accion);
    dbRequest.input("IdActaEntrega", sql.Int, accion === "A" ? integer(body.IdActaEntrega) : null);
    dbRequest.input("NumeroActa", sql.VarChar(50), numeroActa);
    dbRequest.input("FechaEntrega", sql.DateTime, body.FechaEntrega ? new Date(body.FechaEntrega) : new Date());
    dbRequest.input("IdUsuarioEntrega", sql.Int, session.id);
    dbRequest.input("NombreReceptor", sql.VarChar(200), String(body.NombreReceptor).trim());
    dbRequest.input("CargoReceptor", sql.VarChar(200), body.CargoReceptor || null);
    dbRequest.input("IdAreaReceptor", sql.Int, idAreaReceptor);
    dbRequest.input("ServicioArea", sql.VarChar(200), body.ServicioArea || null);
    dbRequest.input("Observaciones", sql.VarChar(1000), body.Observaciones || null);
    dbRequest.input("EstadoActa", sql.VarChar(20), body.EstadoActa || "BORRADOR");
    dbRequest.input("Detalles", detalles);
    const result = await dbRequest.execute("dbo.sp_MantenimientoActaEntrega");
    await transaction.request().query(`
      UPDATE dbo.Bienes
      SET
        IdArea = ${idAreaReceptor},
        IdUsuarioModificacion = ${session.id},
        FechaModificacion = GETDATE()
      WHERE IdBien IN (${bienIds.join(",")})
        AND Activo = 1
    `);
    await transaction.commit();
    return NextResponse.json(result.recordset?.[0] || { Mensaje: "Acta guardada correctamente." }, { status: accion === "R" ? 201 : 200 });
    } catch (error) {
      try { await transaction.rollback(); } catch { /* La transacción puede haber sido revertida por XACT_ABORT. */ }
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 400 });
  }
}

export async function POST(request: Request) { return save(request, "R"); }
export async function PUT(request: Request) { return save(request, "A"); }

export async function PATCH(request: Request) {
  const session = await authSession();
  if (guardFailed(session)) return session;
  try {
    const body = await request.json();
    const allowed = ["E", "V", "N", "T", "D"];
    if (!integer(body.IdActaEntrega) || !allowed.includes(body.Accion)) return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
    if (!isAdminRole(session.role)) {
      const owner = await executeQuery<{ IdUsuarioEntrega: number }>(
        "SELECT IdUsuarioEntrega FROM dbo.ActasEntrega WHERE IdActaEntrega = @IdActaEntrega",
        { IdActaEntrega: integer(body.IdActaEntrega) }
      );
      if (Number(owner.recordset[0]?.IdUsuarioEntrega) !== session.id) {
        return NextResponse.json({ error: "No tiene permisos para gestionar esta acta." }, { status: 403 });
      }
    }
    const pool = await getPool();
    const dbRequest = pool.request();
    dbRequest.input("Accion", sql.Char(1), body.Accion);
    dbRequest.input("IdActaEntrega", sql.Int, integer(body.IdActaEntrega));
    const empty = new sql.Table("dbo.ActaEntregaDetalleType");
    empty.columns.add("IdBien", sql.Int, { nullable: false });
    empty.columns.add("ObservacionDetalle", sql.VarChar(500), { nullable: true });
    dbRequest.input("Detalles", empty);
    const result = await dbRequest.execute("dbo.sp_MantenimientoActaEntrega");
    return NextResponse.json(result.recordset?.[0] || { Mensaje: "Acción realizada." });
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 400 });
  }
}
