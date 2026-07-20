import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { authSession, guardFailed } from "@/lib/auth/guards";
import { executeQuery } from "@/lib/db";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function POST(request: Request) {
  let savedFilePath: string | null = null;

  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const session = auth;

    const formData = await request.formData();
    const idBaja = Number(formData.get("IdBaja"));
    const image = formData.get("imagen");

    if (!Number.isInteger(idBaja) || idBaja <= 0) {
      return NextResponse.json({ error: "El IdBaja no es válido." }, { status: 400 });
    }
    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json({ error: "Debe seleccionar una imagen." }, { status: 400 });
    }
    const extension = IMAGE_EXTENSIONS[image.type];
    if (!extension) {
      return NextResponse.json({ error: "Solo se permiten imágenes JPG, PNG o WEBP." }, { status: 415 });
    }
    if (image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "La imagen no puede superar los 5 MB." }, { status: 413 });
    }

    const existingResult = await executeQuery<{
      IdUsuarioRegistro: number | null;
      EvidenciaFirma: string | null;
    }>(
      "EXEC dbo.sp_ConsultaBajaBien @Accion = @Accion, @IdBaja = @IdBaja",
      { Accion: "I", IdBaja: idBaja }
    );
    const existing = existingResult.recordset?.[0];
    if (!existing) {
      return NextResponse.json({ error: "No se encontró la ficha de baja." }, { status: 404 });
    }

    const role = String(session.role || "").toLowerCase();
    if (role.includes("soporte") && existing.IdUsuarioRegistro && existing.IdUsuarioRegistro !== session.id) {
      return NextResponse.json({ error: "No tiene permisos para actualizar esta ficha de baja." }, { status: 403 });
    }

    const uploadDirectory = path.join(process.cwd(), "public", "uploads", "fichas-baja");
    await mkdir(uploadDirectory, { recursive: true });
    const fileName = `${idBaja}-${randomUUID()}${extension}`;
    savedFilePath = path.join(uploadDirectory, fileName);
    await writeFile(savedFilePath, Buffer.from(await image.arrayBuffer()));

    const publicPath = `/uploads/fichas-baja/${fileName}`;
    await executeQuery(
      `EXEC dbo.sp_MantenimientoBajaBien
         @Accion = @Accion,
         @IdBaja = @IdBaja,
         @EvidenciaFirma = @EvidenciaFirma`,
      { Accion: "F", IdBaja: idBaja, EvidenciaFirma: publicPath }
    );

    const previousPublicPath = existing.EvidenciaFirma;
    if (previousPublicPath?.startsWith("/uploads/fichas-baja/")) {
      const previousFileName = path.basename(previousPublicPath);
      await unlink(path.join(uploadDirectory, previousFileName)).catch(() => undefined);
    }

    return NextResponse.json({ success: true, EvidenciaFirma: publicPath });
  } catch (error) {
    if (savedFilePath) {
      await unlink(savedFilePath).catch(() => undefined);
    }
    console.error("Error en POST /api/soporte/baja/evidencia:", error);
    return NextResponse.json({ error: "No se pudo guardar la evidencia de firma." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const session = auth;

    const idBaja = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(idBaja) || idBaja <= 0) {
      return NextResponse.json({ error: "El IdBaja no es válido." }, { status: 400 });
    }

    const existingResult = await executeQuery<{
      IdUsuarioRegistro: number | null;
      EvidenciaFirma: string | null;
    }>(
      "EXEC dbo.sp_ConsultaBajaBien @Accion = @Accion, @IdBaja = @IdBaja",
      { Accion: "I", IdBaja: idBaja }
    );
    const existing = existingResult.recordset?.[0];
    if (!existing) {
      return NextResponse.json({ error: "No se encontró la ficha de baja." }, { status: 404 });
    }

    const role = String(session.role || "").toLowerCase();
    if (role.includes("soporte") && existing.IdUsuarioRegistro && existing.IdUsuarioRegistro !== session.id) {
      return NextResponse.json({ error: "No tiene permisos para actualizar esta ficha de baja." }, { status: 403 });
    }

    await executeQuery(
      "EXEC dbo.sp_EliminarEvidenciaBaja @IdBaja = @IdBaja",
      { IdBaja: idBaja }
    );

    if (existing.EvidenciaFirma?.startsWith("/uploads/fichas-baja/")) {
      const fileName = path.basename(existing.EvidenciaFirma);
      const filePath = path.join(process.cwd(), "public", "uploads", "fichas-baja", fileName);
      await unlink(filePath).catch(() => undefined);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/soporte/baja/evidencia:", error);
    return NextResponse.json({ error: "No se pudo eliminar la evidencia de firma." }, { status: 500 });
  }
}
