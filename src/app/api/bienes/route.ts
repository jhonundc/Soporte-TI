import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";
import {
  bienCreateApiSchema,
  bienDeleteQuerySchema,
  bienToggleApiSchema,
  bienUpdateApiSchema,
  parseJsonBody,
  parseSearchParams,
} from "@/lib/validations";

// Obtener todos los bienes
export async function GET() {
  const auth = await authSession();
  if (guardFailed(auth)) return auth;

  try {
    const result = await executeQuery(
      `EXEC sp_ConsultaBien @Accion = @Accion`,
      { Accion: "L" }
    );

    const bienes = result.recordset.map((row: any) => ({
      IdBien: row.IdBien,
      CodigoInventario: row.CodigoInventario,
      CodigoPatrimonial: row.CodigoPatrimonial,
      IdCategoria: row.IdCategoria,
      IdMarca: row.IdMarca,
      IdArea: row.IdArea,
      Modelo: row.Modelo,
      NumeroSerie: row.NumeroSerie,
      Descripcion: row.Descripcion,
      IdCondicion: row.IdCondicion,
      IdEstadoBien: row.IdEstadoBien,
      FechaCompra: row.FechaCompra,
      FechaRegistro: row.FechaRegistro,
      FechaModificacion: row.FechaModificacion,
      IdUsuarioRegistro: row.IdUsuarioRegistro,
      IdUsuarioModificacion: row.IdUsuarioModificacion,
      Activo: row.Activo,
      Marca: row.IdMarca
        ? { IdMarca: row.IdMarca, Marca: row.Marca_Marca, Activo: row.Marca_Activo }
        : null,
      Area: row.IdArea
        ? {
            IdArea: row.IdArea,
            NombreArea: row.Area_NombreArea,
            Piso: row.Area_Piso,
            Referencia: row.Area_Referencia,
            Activo: row.Area_Activo,
          }
        : null,
      Condicion: row.IdCondicion
        ? {
            IdCondicion: row.IdCondicion,
            Condicion: row.Condicion_Condicion,
            Activo: row.Condicion_Activo,
          }
        : null,
      Estado: row.IdEstadoBien
        ? {
            IdEstadoBien: row.IdEstadoBien,
            EstadoBien: row.Estado_EstadoBien,
            Activo: row.Estado_Activo,
          }
        : null,
      Categoria: row.IdCategoria
        ? {
            IdCategoria: row.IdCategoria,
            CategoriaBien: row.Categoria_CategoriaBien,
            Activo: row.Categoria_Activo,
          }
        : null,
    }));

    return NextResponse.json(bienes);
  } catch (error) {
    console.error("Error en GET /api/bienes:", error);
    return NextResponse.json(
      { error: "Error al obtener los bienes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await adminSession();
  if (guardFailed(session)) return session;

  try {
    const parsed = await parseJsonBody(bienCreateApiSchema, request);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    const paramsForCreate = {
      CodigoInventario: data.CodigoInventario,
      CodigoPatrimonial: data.CodigoPatrimonial,
      IdCategoria: data.IdCategoria,
      IdMarca: data.IdMarca,
      IdArea: data.IdArea,
      Modelo: data.Modelo,
      NumeroSerie: data.NumeroSerie,
      Descripcion: data.Descripcion,
      IdCondicion: data.IdCondicion,
      IdEstadoBien: data.IdEstadoBien,
      FechaCompra: data.FechaCompra ?? null,
      IdUsuario: session.id,
    };
    const result = await executeQuery(
      `EXEC sp_MantenimientoBien 
        @Accion = @Accion,
        @CodigoInventario = @CodigoInventario, 
        @CodigoPatrimonial = @CodigoPatrimonial, 
        @IdCategoria = @IdCategoria, 
        @IdMarca = @IdMarca, 
        @IdArea = @IdArea, 
        @Modelo = @Modelo,
        @NumeroSerie = @NumeroSerie, 
        @Descripcion = @Descripcion, 
        @IdCondicion = @IdCondicion, 
        @IdEstadoBien = @IdEstadoBien, 
        @FechaCompra = @FechaCompra, 
        @IdUsuario = @IdUsuario`,
      { ...paramsForCreate, Accion: "R" }
    );

    const createdBien = result.recordset?.[0] ?? null;
    if (createdBien) {
      return NextResponse.json(createdBien, { status: 201 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/bienes:", error);
    const msg = (error as any)?.message || String(error);
    return NextResponse.json(
      { error: `Error al crear el bien: ${msg}` },
      { status: 500 }
    );
  }
}

// Actualizar un bien (Editar / Desactivar)
export async function PATCH(request: Request) {
  const session = await adminSession();
  if (guardFailed(session)) return session;

  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const toggleParsed = bienToggleApiSchema.safeParse(raw);
    if (
      toggleParsed.success &&
      typeof raw === "object" &&
      raw !== null &&
      Object.keys(raw).length === 2 &&
      "IdBien" in raw &&
      "Activo" in raw
    ) {
      const data = toggleParsed.data;
      await executeQuery(
        `EXEC sp_MantenimientoBien 
          @Accion = @Accion,
          @IdBien = @IdBien,
          @IdUsuario = @IdUsuario`,
        {
          IdBien: data.IdBien,
          IdUsuario: session.id,
          Accion: data.Activo ? "T" : "E",
        }
      );
      return NextResponse.json({ success: true });
    }

    const updateParsed = bienUpdateApiSchema.safeParse(raw);
    if (!updateParsed.success) {
      return NextResponse.json(
        { error: updateParsed.error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }
    const data = updateParsed.data;

    const params = {
      IdBien: data.IdBien,
      CodigoInventario: data.CodigoInventario ?? null,
      CodigoPatrimonial: data.CodigoPatrimonial ?? null,
      IdCategoria: data.IdCategoria ?? null,
      IdMarca: data.IdMarca ?? null,
      IdArea: data.IdArea ?? null,
      Modelo: data.Modelo ?? null,
      NumeroSerie: data.NumeroSerie ?? null,
      Descripcion: data.Descripcion ?? null,
      IdCondicion: data.IdCondicion ?? null,
      IdEstadoBien: data.IdEstadoBien ?? null,
      FechaCompra: data.FechaCompra ?? null,
      IdUsuarioModificacion: session.id,
    };

    await executeQuery(
      `EXEC sp_MantenimientoBien 
        @Accion = @Accion,
        @IdBien = @IdBien, 
        @CodigoInventario = @CodigoInventario, 
        @CodigoPatrimonial = @CodigoPatrimonial, 
        @IdCategoria = @IdCategoria, 
        @IdMarca = @IdMarca, 
        @IdArea = @IdArea, 
        @Modelo = @Modelo,
        @NumeroSerie = @NumeroSerie, 
        @Descripcion = @Descripcion, 
        @IdCondicion = @IdCondicion, 
        @IdEstadoBien = @IdEstadoBien, 
        @FechaCompra = @FechaCompra, 
        @IdUsuario = @IdUsuarioModificacion`,
      { ...params, Accion: "A" }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PATCH /api/bienes:", error);
    const msg = (error as any)?.message || String(error);
    return NextResponse.json(
      { error: `Error al actualizar el bien: ${msg}` },
      { status: 500 }
    );
  }
}

// Dar de baja un bien (eliminación lógica)
export async function DELETE(request: Request) {
  const session = await adminSession();
  if (guardFailed(session)) return session;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseSearchParams(bienDeleteQuerySchema, searchParams);
    if ("error" in parsed) return parsed.error;
    const id = parsed.data.id;

    await executeQuery(`EXEC sp_MantenimientoBien 
        @Accion = @Accion,
        @IdBien = @IdBien,
        @IdUsuario = @IdUsuario`, {
      IdBien: id,
      IdUsuario: session.id,
      Accion: "E",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/bienes:", error);
    const msg = (error as any)?.message || String(error);
    return NextResponse.json(
      { error: `Error al dar de baja el bien: ${msg}` },
      { status: 500 }
    );
  }
}

