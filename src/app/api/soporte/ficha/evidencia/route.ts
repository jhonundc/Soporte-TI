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

type ExistingFicha = {
  IdUsuarioSoporte: number | null;
  EvidenciaFirma: string | null;
};

async function findFicha(idSoporte: number) {
  const result = await executeQuery<ExistingFicha>(
    "EXEC dbo.sp_ConsultaSoporte @Accion = @Accion, @IdSoporte = @IdSoporte",
    { Accion: "I", IdSoporte: idSoporte }
  );
  return result.recordset?.[0];
}

function canUpdate(session: { id: number; role: string }, ficha: ExistingFicha) {
  const isSupport = String(session.role || "").toLowerCase().includes("soporte");
  return !isSupport || !ficha.IdUsuarioSoporte || ficha.IdUsuarioSoporte === session.id;
}

export async function POST(request: Request) {
  let savedFilePath: string | null = null;

  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;

    const formData = await request.formData();
    const idSoporte = Number(formData.get("IdSoporte"));
    const image = formData.get("imagen");
    if (!Number.isInteger(idSoporte) || idSoporte <= 0) {
      return NextResponse.json({ error: "El IdSoporte no es válido." }, { status: 400 });
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

    const existing = await findFicha(idSoporte);
    if (!existing) return NextResponse.json({ error: "No se encontró la ficha de soporte." }, { status: 404 });
    if (!canUpdate(auth, existing)) {
      return NextResponse.json({ error: "No tiene permisos para actualizar esta ficha." }, { status: 403 });
    }

    const uploadDirectory = path.join(process.cwd(), "public", "uploads", "fichas-soporte");
    await mkdir(uploadDirectory, { recursive: true });
    const fileName = `${idSoporte}-${randomUUID()}${extension}`;
    savedFilePath = path.join(uploadDirectory, fileName);
    await writeFile(savedFilePath, Buffer.from(await image.arrayBuffer()));

    const publicPath = `/uploads/fichas-soporte/${fileName}`;
    await executeQuery(
      "EXEC dbo.sp_GuardarEvidenciaSoporte @IdSoporte = @IdSoporte, @EvidenciaFirma = @EvidenciaFirma",
      { IdSoporte: idSoporte, EvidenciaFirma: publicPath }
    );

    if (existing.EvidenciaFirma?.startsWith("/uploads/fichas-soporte/")) {
      await unlink(path.join(uploadDirectory, path.basename(existing.EvidenciaFirma))).catch(() => undefined);
    }
    return NextResponse.json({ success: true, EvidenciaFirma: publicPath });
  } catch (error) {
    if (savedFilePath) await unlink(savedFilePath).catch(() => undefined);
    console.error("Error en POST /api/soporte/ficha/evidencia:", error);
    return NextResponse.json({ error: "No se pudo guardar la evidencia de firma." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authSession();
    if (guardFailed(auth)) return auth;
    const idSoporte = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(idSoporte) || idSoporte <= 0) {
      return NextResponse.json({ error: "El IdSoporte no es válido." }, { status: 400 });
    }

    const existing = await findFicha(idSoporte);
    if (!existing) return NextResponse.json({ error: "No se encontró la ficha de soporte." }, { status: 404 });
    if (!canUpdate(auth, existing)) {
      return NextResponse.json({ error: "No tiene permisos para actualizar esta ficha." }, { status: 403 });
    }

    await executeQuery("EXEC dbo.sp_EliminarEvidenciaSoporte @IdSoporte = @IdSoporte", { IdSoporte: idSoporte });
    if (existing.EvidenciaFirma?.startsWith("/uploads/fichas-soporte/")) {
      const filePath = path.join(process.cwd(), "public", "uploads", "fichas-soporte", path.basename(existing.EvidenciaFirma));
      await unlink(filePath).catch(() => undefined);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/soporte/ficha/evidencia:", error);
    return NextResponse.json({ error: "No se pudo eliminar la evidencia de firma." }, { status: 500 });
  }
}
