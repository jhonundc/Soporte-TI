import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

// Obtener todos los software del catálogo
export async function GET() {
  try {
    const result = await executeQuery(
      "SELECT * FROM SoftwareCatalogo WHERE Activo = 1 ORDER BY NombreSoftware ASC"
    );
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error en GET /api/software-catalogo:", error);
    return NextResponse.json(
      { error: "Error al obtener el catálogo de software" },
      { status: 500 }
    );
  }
}

// Crear nuevo software en el catálogo
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("POST software-catalogo con datos:", data);
    
    if (!data.NombreSoftware) {
      return NextResponse.json(
        { error: "El nombre del software es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO SoftwareCatalogo (NombreSoftware, Activo) 
       OUTPUT INSERTED.* 
       VALUES (@NombreSoftware, 1)`,
      {
        NombreSoftware: data.NombreSoftware,
      }
    );
    
    console.log("Resultado de INSERT:", result);
    
    if (!result.recordset || result.recordset.length === 0) {
      throw new Error("No se retornó registro insertado");
    }
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error: any) {
    console.error("Error en POST /api/software-catalogo:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear el software" },
      { status: 500 }
    );
  }
}

// Actualizar software del catálogo
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    console.log("PATCH software-catalogo con datos:", data);
    
    if (!data.IdSoftwareCatalogo || !data.NombreSoftware) {
      return NextResponse.json(
        { error: "El ID y el nombre del software son requeridos" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `UPDATE SoftwareCatalogo 
       SET NombreSoftware = @NombreSoftware 
       OUTPUT INSERTED.* 
       WHERE IdSoftwareCatalogo = @IdSoftwareCatalogo`,
      {
        IdSoftwareCatalogo: parseInt(data.IdSoftwareCatalogo),
        NombreSoftware: data.NombreSoftware,
      }
    );
    
    console.log("Resultado de UPDATE:", result);
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Software no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error: any) {
    console.error("Error en PATCH /api/software-catalogo:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar el software" },
      { status: 500 }
    );
  }
}

// Desactivar software del catálogo (Soft Delete)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    console.log("DELETE software-catalogo con id:", id);
    
    if (!id) {
      return NextResponse.json(
        { error: "El ID es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `UPDATE SoftwareCatalogo 
       SET Activo = 0 
       OUTPUT INSERTED.* 
       WHERE IdSoftwareCatalogo = @IdSoftwareCatalogo`,
      {
        IdSoftwareCatalogo: parseInt(id),
      }
    );
    
    console.log("Resultado de DELETE:", result);
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Software no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error: any) {
    console.error("Error en DELETE /api/software-catalogo:", error);
    return NextResponse.json(
      { error: error.message || "Error al desactivar el software" },
      { status: 500 }
    );
  }
}
