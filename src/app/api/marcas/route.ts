import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

// Obtener todas las marcas
export async function GET() {
  try {
    const result = await executeQuery(
      "SELECT * FROM Marcas WHERE Activo = 1 ORDER BY Marca ASC"
    );
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error en GET /api/marcas:", error);
    return NextResponse.json(
      { error: "Error al obtener las marcas" },
      { status: 500 }
    );
  }
}

// Crear una nueva marca
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.Marca) {
      return NextResponse.json(
        { error: "El nombre de la marca es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO Marcas (Marca, Activo) 
       OUTPUT INSERTED.* 
       VALUES (@Marca, 1)`,
      {
        Marca: data.Marca,
      }
    );
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/marcas:", error);
    return NextResponse.json(
      { error: "Error al crear la marca" },
      { status: 500 }
    );
  }
}

// Actualizar una marca
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.IdMarca || !data.Marca) {
      return NextResponse.json(
        { error: "El ID y el nombre de la marca son requeridos" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `UPDATE Marcas 
       SET Marca = @Marca 
       OUTPUT INSERTED.* 
       WHERE IdMarca = @IdMarca`,
      {
        IdMarca: parseInt(data.IdMarca),
        Marca: data.Marca,
      }
    );
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Marca no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en PATCH /api/marcas:", error);
    return NextResponse.json(
      { error: "Error al actualizar la marca" },
      { status: 500 }
    );
  }
}

// Desactivar una marca (Soft Delete)
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
      `UPDATE Marcas 
       SET Activo = 0 
       OUTPUT INSERTED.* 
       WHERE IdMarca = @IdMarca`,
      {
        IdMarca: parseInt(id),
      }
    );
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Marca no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en DELETE /api/marcas:", error);
    return NextResponse.json(
      { error: "Error al desactivar la marca" },
      { status: 500 }
    );
  }
}

