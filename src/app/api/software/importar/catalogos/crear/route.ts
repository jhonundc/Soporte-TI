import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

type CatalogType =
  | "softwareCatalogo"
  | "tipoSoftware"
  | "proveedor"
  | "tipoLicencia"
  | "estadoLicencia"
  | "tipoAsignacion";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.id) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const body = await request.json();
    const tipo = String(body?.tipo || "").trim() as CatalogType;
    const nombre = String(body?.nombre || "").trim();

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    if (
      ![
        "softwareCatalogo",
        "tipoSoftware",
        "proveedor",
        "tipoLicencia",
        "estadoLicencia",
        "tipoAsignacion",
      ].includes(tipo)
    ) {
      return NextResponse.json({ error: "Tipo de catálogo no válido" }, { status: 400 });
    }

    if (tipo === "softwareCatalogo") {
      await executeQuery(
        "EXEC sp_MantenimientoSoftwareCatalogo @Accion = @Accion, @IdSoftwareCatalogo = @IdSoftwareCatalogo, @NombreSoftware = @NombreSoftware",
        {
          Accion: "R",
          IdSoftwareCatalogo: 0,
          NombreSoftware: nombre,
        }
      );
    }

    if (tipo === "tipoSoftware") {
      await executeQuery(
        "EXEC sp_MantenimientoTipoSoftware @Accion = @Accion, @IdTipoSoftware = @IdTipoSoftware, @TipoSoftware = @TipoSoftware",
        {
          Accion: "R",
          IdTipoSoftware: 0,
          TipoSoftware: nombre,
        }
      );
    }

    if (tipo === "proveedor") {
      await executeQuery(
        "EXEC sp_MantenimientoProveedor @Accion = @Accion, @IdProveedor = @IdProveedor, @Proveedor = @Proveedor",
        {
          Accion: "R",
          IdProveedor: 0,
          Proveedor: nombre,
        }
      );
    }

    if (tipo === "tipoLicencia") {
      await executeQuery(
        "EXEC sp_MantenimientoTipoLicencia @Accion = @Accion, @IdTipoLicencia = @IdTipoLicencia, @TipoLicencia = @TipoLicencia",
        {
          Accion: "R",
          IdTipoLicencia: 0,
          TipoLicencia: nombre,
        }
      );
    }

    if (tipo === "estadoLicencia") {
      await executeQuery(
        "EXEC sp_MantenimientoEstadoLicencia @Accion = @Accion, @IdEstadoLicencia = @IdEstadoLicencia, @EstadoLicencia = @EstadoLicencia",
        {
          Accion: "R",
          IdEstadoLicencia: 0,
          EstadoLicencia: nombre,
        }
      );
    }

    if (tipo === "tipoAsignacion") {
      await executeQuery(
        "EXEC sp_MantenimientoTipoAsignacionSoftware @Accion = @Accion, @IdTipoAsignacion = @IdTipoAsignacion, @TipoAsignacion = @TipoAsignacion",
        {
          Accion: "R",
          IdTipoAsignacion: 0,
          TipoAsignacion: nombre,
        }
      );
    }

    return NextResponse.json({ ok: true, tipo, nombre }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/software/importar/catalogos/crear:", error);
    const message = (error as any)?.message || "No se pudo crear el catálogo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
