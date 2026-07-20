import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { authSession, guardFailed, isAdminRole } from "@/lib/auth/guards";
import { executeQuery, getPool, sql } from "@/lib/db";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

type ExistingActa = { IdUsuarioEntrega: number | null; EvidenciaFirma: string | null };

async function findActa(idActaEntrega: number) {
  const result = await executeQuery<ExistingActa>(
    "EXEC dbo.sp_ConsultaActaEntrega @Accion = @Accion, @IdActaEntrega = @IdActaEntrega",
    { Accion: "I", IdActaEntrega: idActaEntrega }
  );
  return result.recordset?.[0];
}

function canUpdate(session: { id: number; role: string }, acta: ExistingActa) {
  return isAdminRole(session.role) || !acta.IdUsuarioEntrega || acta.IdUsuarioEntrega === session.id;
}

export async function POST(request: Request) {
  let savedFilePath: string | null = null;
  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const formData = await request.formData();
    const idActaEntrega = Number(formData.get("IdActaEntrega"));
    const image = formData.get("imagen");
    if (!Number.isInteger(idActaEntrega) || idActaEntrega <= 0) return NextResponse.json({ error: "El IdActaEntrega no es válido." }, { status: 400 });
    if (!(image instanceof File) || image.size === 0) return NextResponse.json({ error: "Debe seleccionar una imagen." }, { status: 400 });
    const extension = IMAGE_EXTENSIONS[image.type];
    if (!extension) return NextResponse.json({ error: "Solo se permiten imágenes JPG, PNG o WEBP." }, { status: 415 });
    if (image.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: "La imagen no puede superar los 5 MB." }, { status: 413 });

    const existing = await findActa(idActaEntrega);
    if (!existing) return NextResponse.json({ error: "No se encontró el acta de entrega." }, { status: 404 });
    if (!canUpdate(auth, existing)) return NextResponse.json({ error: "No tiene permisos para actualizar esta acta." }, { status: 403 });

    const uploadDirectory = path.join(process.cwd(), "public", "uploads", "actas-entrega");
    await mkdir(uploadDirectory, { recursive: true });
    const fileName = `${idActaEntrega}-${randomUUID()}${extension}`;
    savedFilePath = path.join(uploadDirectory, fileName);
    await writeFile(savedFilePath, Buffer.from(await image.arrayBuffer()));
    const publicPath = `/uploads/actas-entrega/${fileName}`;

    const pool = await getPool();
    const dbRequest = pool.request();
    dbRequest.input("Accion", sql.Char(1), "F");
    dbRequest.input("IdActaEntrega", sql.Int, idActaEntrega);
    dbRequest.input("EvidenciaFirma", sql.VarChar(500), publicPath);
    const detalles = new sql.Table("dbo.ActaEntregaDetalleType");
    detalles.columns.add("IdBien", sql.Int, { nullable: false });
    detalles.columns.add("ObservacionDetalle", sql.VarChar(500), { nullable: true });
    dbRequest.input("Detalles", detalles);
    await dbRequest.execute("dbo.sp_MantenimientoActaEntrega");

    if (existing.EvidenciaFirma?.startsWith("/uploads/actas-entrega/")) {
      await unlink(path.join(uploadDirectory, path.basename(existing.EvidenciaFirma))).catch(() => undefined);
    }
    return NextResponse.json({ success: true, EvidenciaFirma: publicPath });
  } catch (error) {
    if (savedFilePath) await unlink(savedFilePath).catch(() => undefined);
    console.error("Error en POST /api/soporte/actas-entrega/evidencia:", error);
    return NextResponse.json({ error: "No se pudo guardar la evidencia firmada." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const idActaEntrega = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(idActaEntrega) || idActaEntrega <= 0) return NextResponse.json({ error: "El IdActaEntrega no es válido." }, { status: 400 });
    const existing = await findActa(idActaEntrega);
    if (!existing) return NextResponse.json({ error: "No se encontró el acta de entrega." }, { status: 404 });
    if (!canUpdate(auth, existing)) return NextResponse.json({ error: "No tiene permisos para actualizar esta acta." }, { status: 403 });

    await executeQuery("EXEC dbo.sp_EliminarEvidenciaActaEntrega @IdActaEntrega = @IdActaEntrega", { IdActaEntrega: idActaEntrega });
    if (existing.EvidenciaFirma?.startsWith("/uploads/actas-entrega/")) {
      const filePath = path.join(process.cwd(), "public", "uploads", "actas-entrega", path.basename(existing.EvidenciaFirma));
      await unlink(filePath).catch(() => undefined);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/soporte/actas-entrega/evidencia:", error);
    return NextResponse.json({ error: "No se pudo eliminar la evidencia firmada." }, { status: 500 });
  }
}
