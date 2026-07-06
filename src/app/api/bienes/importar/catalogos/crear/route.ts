import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

type CatalogType = "categoria" | "marca" | "area" | "condicion";

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
    const tipo = String(body?.tipo || "").trim().toLowerCase() as CatalogType;
    const nombre = String(body?.nombre || "").trim();

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    if (!["categoria", "marca", "area", "condicion"].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo de catálogo no válido" },
        { status: 400 }
      );
    }

    if (tipo === "categoria") {
      await executeQuery(
        "EXEC sp_MantenimientoCategoriaBien @Accion = @Accion, @IdCategoria = @IdCategoria, @CategoriaBien = @CategoriaBien",
        {
          Accion: "R",
          IdCategoria: 0,
          CategoriaBien: nombre,
        }
      );
    }

    if (tipo === "marca") {
      await executeQuery(
        "EXEC sp_MantenimientoMarca @Accion = @Accion, @IdMarca = @IdMarca, @Marca = @Marca",
        {
          Accion: "R",
          IdMarca: 0,
          Marca: nombre,
        }
      );
    }

    if (tipo === "area") {
      await executeQuery(
        "EXEC sp_MantenimientoArea @Accion = @Accion, @IdArea = @IdArea, @NombreArea = @NombreArea, @Piso = @Piso, @Referencia = @Referencia",
        {
          Accion: "R",
          IdArea: 0,
          NombreArea: nombre,
          Piso: null,
          Referencia: null,
        }
      );
    }

    if (tipo === "condicion") {
      await executeQuery(
        "EXEC sp_MantenimientoCondicionBien @Accion = @Accion, @IdCondicion = @IdCondicion, @Condicion = @Condicion",
        {
          Accion: "R",
          IdCondicion: 0,
          Condicion: nombre,
        }
      );
    }

    return NextResponse.json({ ok: true, tipo, nombre }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/bienes/importar/catalogos/crear:", error);
    const message = (error as any)?.message || "No se pudo crear el catálogo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
