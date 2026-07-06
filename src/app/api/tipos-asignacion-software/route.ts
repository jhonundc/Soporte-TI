import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

// Obtener todos los tipos de asignación de software
export async function GET() {
  try {
    const result = await executeQuery(
      "SELECT * FROM TipoAsignacionSoftware WHERE Activo = 1 ORDER BY TipoAsignacion ASC"
    );
    return NextResponse.json(result.recordset);
  } catch (error: any) {
    console.error("Error en GET /api/tipos-asignacion-software:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener los tipos de asignación" },
      { status: 500 }
    );
  }
}

// Crear nuevo tipo de asignación de software
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("POST tipos-asignacion-software con datos:", data);
    
    if (!data.TipoAsignacion) {
      return NextResponse.json(
        { error: "El nombre del tipo de asignación es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO TipoAsignacionSoftware (TipoAsignacion, Activo) 
       OUTPUT INSERTED.* 
       VALUES (@TipoAsignacion, 1)`,
      {
        TipoAsignacion: data.TipoAsignacion,
      }
    );
    
    console.log("Resultado de INSERT:", result);
    
    if (!result.recordset || result.recordset.length === 0) {
      throw new Error("No se retornó registro insertado");
    }
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error: any) {
    console.error("Error en POST /api/tipos-asignacion-software:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear el tipo de asignación" },
      { status: 500 }
    );
  }
}

// Actualizar tipo de asignación de software
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    console.log("PATCH tipos-asignacion-software con datos:", data);
    
    if (!data.IdTipoAsignacion || !data.TipoAsignacion) {
      return NextResponse.json(
        { error: "El ID y el nombre del tipo de asignación son requeridos" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `UPDATE TipoAsignacionSoftware 
       SET TipoAsignacion = @TipoAsignacion 
       OUTPUT INSERTED.* 
       WHERE IdTipoAsignacion = @IdTipoAsignacion`,
      {
        IdTipoAsignacion: parseInt(data.IdTipoAsignacion),
        TipoAsignacion: data.TipoAsignacion,
      }
    );
    
    console.log("Resultado de UPDATE:", result);
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Tipo de asignación no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error: any) {
    console.error("Error en PATCH /api/tipos-asignacion-software:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar el tipo de asignación" },
      { status: 500 }
    );
  }
}

// Desactivar tipo de asignación de software (Soft Delete)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    console.log("DELETE tipos-asignacion-software con id:", id);
    
    if (!id) {
      return NextResponse.json(
        { error: "El ID es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `UPDATE TipoAsignacionSoftware 
       SET Activo = 0 
       OUTPUT INSERTED.* 
       WHERE IdTipoAsignacion = @IdTipoAsignacion`,
      {
        IdTipoAsignacion: parseInt(id),
      }
    );
    
    console.log("Resultado de DELETE:", result);
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Tipo de asignación no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error: any) {
    console.error("Error en DELETE /api/tipos-asignacion-software:", error);
    return NextResponse.json(
      { error: error.message || "Error al desactivar el tipo de asignación" },
      { status: 500 }
    );
  }
}
