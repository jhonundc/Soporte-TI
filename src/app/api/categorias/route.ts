import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

// Obtener todas las categorías
export async function GET() {
  try {
    const result = await executeQuery(
      "SELECT * FROM CategoriasBienes WHERE Activo = 1 ORDER BY CategoriaBien ASC"
    );
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error en GET /api/categorias:", error);
    return NextResponse.json(
      { error: "Error al obtener las categorías" },
      { status: 500 }
    );
  }
}

// Crear una nueva categoría
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.CategoriaBien) {
      return NextResponse.json(
        { error: "El nombre de la categoría es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `EXEC sp_MantenimientoCategoriaBien @Accion = @Accion, @CategoriaBien = @CategoriaBien`,
      {
        Accion: "R",
        CategoriaBien: data.CategoriaBien,
      }
    );

    return NextResponse.json(result.recordset[0] || { Mensaje: "Categoría registrada" }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/categorias:", error);
    return NextResponse.json(
      { error: "Error al crear la categoría" },
      { status: 500 }
    );
  }
}

// Actualizar una categoría
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    
    const id = data.IdCategoria ? parseInt(data.IdCategoria) : null;
    if (!id) {
      return NextResponse.json({ error: "IdCategoria es requerido" }, { status: 400 });
    }

    // Soporte para activar/desactivar mediante campo Activar
    if (data.Activar === true || data.Activar === false) {
      const accion = data.Activar ? "T" : "E";
      const result = await executeQuery(
        `EXEC sp_MantenimientoCategoriaBien @Accion = @Accion, @IdCategoria = @IdCategoria`,
        { Accion: accion, IdCategoria: id }
      );
      return NextResponse.json(result.recordset[0] || { Mensaje: accion === "T" ? "Categoría activada" : "Categoría desactivada" });
    }

    if (!data.CategoriaBien) {
      return NextResponse.json({ error: "El nombre de la categoría es requerido para actualizar" }, { status: 400 });
    }

    const updateResult = await executeQuery(
      `EXEC sp_MantenimientoCategoriaBien @Accion = @Accion, @IdCategoria = @IdCategoria, @CategoriaBien = @CategoriaBien`,
      {
        Accion: "A",
        IdCategoria: id,
        CategoriaBien: data.CategoriaBien,
      }
    );

    return NextResponse.json(updateResult.recordset[0] || { Mensaje: "Categoría actualizada correctamente." });
  } catch (error) {
    console.error("Error en PATCH /api/categorias:", error);
    return NextResponse.json(
      { error: "Error al actualizar la categoría" },
      { status: 500 }
    );
  }
}

// Desactivar una categoría (Soft Delete)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "El ID es requerido" },
        { status: 400 }
      );
    }
    const permanent = searchParams.get("permanent") === "1" || searchParams.get("permanent") === "true";
    const accion = permanent ? "D" : "E";

    try {
      const result = await executeQuery(
        `EXEC sp_MantenimientoCategoriaBien @Accion = @Accion, @IdCategoria = @IdCategoria`,
        {
          Accion: accion,
          IdCategoria: parseInt(id),
        }
      );

      if (result.recordset.length === 0) {
        return NextResponse.json(
          { error: "Categoría no encontrada" },
          { status: 404 }
        );
      }

      return NextResponse.json(result.recordset[0]);
    } catch (err: any) {
      const msg = (err && err.message) || "Error al eliminar la categoría";
      console.error("Error al ejecutar sp_MantenimientoCategoriaBien (DELETE):", err);
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (error) {
    console.error("Error en DELETE /api/categorias:", error);
    return NextResponse.json(
      { error: "Error al desactivar la categoría" },
      { status: 500 }
    );
  }
}

