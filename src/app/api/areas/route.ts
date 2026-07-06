import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// Obtener todas las áreas
export async function GET() {
  try {
    const result = await executeQuery(
      "SELECT IdArea, NombreArea, Piso, Referencia, Activo FROM Areas ORDER BY NombreArea ASC"
    );
    return NextResponse.json(result.recordset || []);
  } catch (error) {
    console.error("Error en GET /api/areas:", error);
    return NextResponse.json(
      { error: "Error al obtener las áreas" },
      { status: 500 }
    );
  }
}

// Crear una nueva área
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.NombreArea) {
      return NextResponse.json(
        { error: "El nombre del área es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `EXEC pro_CrearArea @NombreArea = @NombreArea, @Piso = @Piso, @Referencia = @Referencia`,
      {
        NombreArea: data.NombreArea,
        Piso: data.Piso || null,
        Referencia: data.Referencia || null,
      }
    );
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/areas:", error);
    return NextResponse.json(
      { error: "Error al crear el área" },
      { status: 500 }
    );
  }
}

// Actualizar un área
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.IdArea || !data.NombreArea) {
      return NextResponse.json(
        { error: "El ID y el nombre del área son requeridos" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `EXEC pro_ActualizarArea @IdArea = @IdArea, @NombreArea = @NombreArea, @Piso = @Piso, @Referencia = @Referencia`,
      {
        IdArea: parseInt(data.IdArea),
        NombreArea: data.NombreArea,
        Piso: data.Piso || null,
        Referencia: data.Referencia || null,
      }
    );
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Área no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en PATCH /api/areas:", error);
    return NextResponse.json(
      { error: "Error al actualizar el área" },
      { status: 500 }
    );
  }
}

// Desactivar un área (Soft Delete)
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
      `EXEC pro_DesactivarArea @IdArea = @IdArea`,
      {
        IdArea: parseInt(id),
      }
    );
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Área no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en DELETE /api/areas:", error);
    return NextResponse.json(
      { error: "Error al desactivar el área" },
      { status: 500 }
    );
  }
}

