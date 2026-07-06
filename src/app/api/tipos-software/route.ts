import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

// Obtener todos los tipos de software
export async function GET() {
  try {
    const result = await executeQuery(
      "SELECT * FROM TipoSoftware WHERE Activo = 1 ORDER BY TipoSoftware ASC"
    );
    return NextResponse.json(result.recordset);
  } catch (error: any) {
    console.error("Error en GET /api/tipos-software:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener los tipos de software" },
      { status: 500 }
    );
  }
}

// Crear nuevo tipo de software
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("POST tipos-software con datos:", data);
    
    if (!data.TipoSoftware) {
      return NextResponse.json(
        { error: "El nombre del tipo de software es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO TipoSoftware (TipoSoftware, Activo) 
       OUTPUT INSERTED.* 
       VALUES (@TipoSoftware, 1)`,
      {
        TipoSoftware: data.TipoSoftware,
      }
    );
    
    console.log("Resultado de INSERT:", result);
    
    if (!result.recordset || result.recordset.length === 0) {
      throw new Error("No se retornó registro insertado");
    }
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error: any) {
    console.error("Error en POST /api/tipos-software:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear el tipo de software" },
      { status: 500 }
    );
  }
}

// Actualizar tipo de software
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    console.log("PATCH tipos-software con datos:", data);
    
    if (!data.IdTipoSoftware || !data.TipoSoftware) {
      return NextResponse.json(
        { error: "El ID y el nombre del tipo de software son requeridos" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `UPDATE TipoSoftware 
       SET TipoSoftware = @TipoSoftware 
       OUTPUT INSERTED.* 
       WHERE IdTipoSoftware = @IdTipoSoftware`,
      {
        IdTipoSoftware: parseInt(data.IdTipoSoftware),
        TipoSoftware: data.TipoSoftware,
      }
    );
    
    console.log("Resultado de UPDATE:", result);
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Tipo de software no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error: any) {
    console.error("Error en PATCH /api/tipos-software:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar el tipo de software" },
      { status: 500 }
    );
  }
}

// Desactivar tipo de software (Soft Delete)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    console.log("DELETE tipos-software con id:", id);
    
    if (!id) {
      return NextResponse.json(
        { error: "El ID es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `UPDATE TipoSoftware 
       SET Activo = 0 
       OUTPUT INSERTED.* 
       WHERE IdTipoSoftware = @IdTipoSoftware`,
      {
        IdTipoSoftware: parseInt(id),
      }
    );
    
    console.log("Resultado de DELETE:", result);
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Tipo de software no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error: any) {
    console.error("Error en DELETE /api/tipos-software:", error);
    return NextResponse.json(
      { error: error.message || "Error al desactivar el tipo de software" },
      { status: 500 }
    );
  }
}
