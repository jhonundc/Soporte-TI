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
      `INSERT INTO CategoriasBienes (CategoriaBien, Activo) 
       OUTPUT INSERTED.* 
       VALUES (@CategoriaBien, 1)`,
      {
        CategoriaBien: data.CategoriaBien,
      }
    );
    
    return NextResponse.json(result.recordset[0], { status: 201 });
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
    
    if (!data.IdCategoria || !data.CategoriaBien) {
      return NextResponse.json(
        { error: "El ID y el nombre de la categoría son requeridos" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `UPDATE CategoriasBienes 
       SET CategoriaBien = @CategoriaBien 
       OUTPUT INSERTED.* 
       WHERE IdCategoria = @IdCategoria`,
      {
        IdCategoria: parseInt(data.IdCategoria),
        CategoriaBien: data.CategoriaBien,
      }
    );
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
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

    const result = await executeQuery(
      `UPDATE CategoriasBienes 
       SET Activo = 0 
       OUTPUT INSERTED.* 
       WHERE IdCategoria = @IdCategoria`,
      {
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
  } catch (error) {
    console.error("Error en DELETE /api/categorias:", error);
    return NextResponse.json(
      { error: "Error al desactivar la categoría" },
      { status: 500 }
    );
  }
}

