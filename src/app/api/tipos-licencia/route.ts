import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

// Obtener todos los tipos de licencia
export async function GET() {
  try {
    const result = await executeQuery(
      "SELECT * FROM TipoLicencia WHERE Activo = 1 ORDER BY TipoLicencia ASC"
    );
    return NextResponse.json(result.recordset);
  } catch (error: any) {
    console.error("Error en GET /api/tipos-licencia:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener los tipos de licencia" },
      { status: 500 }
    );
  }
}

// Crear nuevo tipo de licencia
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("POST tipos-licencia con datos:", data);
    
    if (!data.TipoLicencia) {
      return NextResponse.json(
        { error: "El nombre del tipo de licencia es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO TipoLicencia (TipoLicencia, Activo) 
       OUTPUT INSERTED.* 
       VALUES (@TipoLicencia, 1)`,
      {
        TipoLicencia: data.TipoLicencia,
      }
    );
    
    console.log("Resultado de INSERT:", result);
    
    if (!result.recordset || result.recordset.length === 0) {
      throw new Error("No se retornó registro insertado");
    }
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error: any) {
    console.error("Error en POST /api/tipos-licencia:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear el tipo de licencia" },
      { status: 500 }
    );
  }
}

// Actualizar tipo de licencia
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    console.log("PATCH tipos-licencia con datos:", data);
    
    if (!data.IdTipoLicencia || !data.TipoLicencia) {
      return NextResponse.json(
        { error: "El ID y el nombre del tipo de licencia son requeridos" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `UPDATE TipoLicencia 
       SET TipoLicencia = @TipoLicencia 
       OUTPUT INSERTED.* 
       WHERE IdTipoLicencia = @IdTipoLicencia`,
      {
        IdTipoLicencia: parseInt(data.IdTipoLicencia),
        TipoLicencia: data.TipoLicencia,
      }
    );
    
    console.log("Resultado de UPDATE:", result);
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Tipo de licencia no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error: any) {
    console.error("Error en PATCH /api/tipos-licencia:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar el tipo de licencia" },
      { status: 500 }
    );
  }
}

// Desactivar tipo de licencia (Soft Delete)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    console.log("DELETE tipos-licencia con id:", id);
    
    if (!id) {
      return NextResponse.json(
        { error: "El ID es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `UPDATE TipoLicencia 
       SET Activo = 0 
       OUTPUT INSERTED.* 
       WHERE IdTipoLicencia = @IdTipoLicencia`,
      {
        IdTipoLicencia: parseInt(id),
      }
    );
    
    console.log("Resultado de DELETE:", result);
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Tipo de licencia no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error: any) {
    console.error("Error en DELETE /api/tipos-licencia:", error);
    return NextResponse.json(
      { error: error.message || "Error al desactivar el tipo de licencia" },
      { status: 500 }
    );
  }
}
