import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

// Obtener todas las áreas
export async function GET() {
  try {
    const result = await executeQuery(
      "EXEC sp_ConsultaArea @Accion = @Accion",
      { Accion: "L" }
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
      `EXEC sp_MantenimientoArea @Accion = @Accion, @NombreArea = @NombreArea, @Piso = @Piso, @Referencia = @Referencia`,
      {
        Accion: "R",
        NombreArea: data.NombreArea,
        Piso: data.Piso || null,
        Referencia: data.Referencia || null,
      }
    );

    return NextResponse.json(result.recordset[0] || { Mensaje: "Área registrada" }, { status: 201 });
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
    
    const id = data.IdArea ? parseInt(data.IdArea) : null;
    if (!id) {
      return NextResponse.json(
        { error: "IdArea es requerido" },
        { status: 400 }
      );
    }

    // Si viene la bandera Activar (true/false), solo cambiamos estado
    if (data.Activar === true || data.Activar === false) {
      const accion = data.Activar ? "T" : "E";
      const result = await executeQuery(
        `EXEC sp_MantenimientoArea @Accion = @Accion, @IdArea = @IdArea`,
        { Accion: accion, IdArea: id }
      );

      return NextResponse.json(result.recordset[0] || { Mensaje: accion === "T" ? "Área activada" : "Área desactivada" });
    }

    // Actualizar datos del área
    if (!data.NombreArea) {
      return NextResponse.json(
        { error: "El nombre del área es requerido para actualizar" },
        { status: 400 }
      );
    }

    const updateResult = await executeQuery(
      `EXEC sp_MantenimientoArea @Accion = @Accion, @IdArea = @IdArea, @NombreArea = @NombreArea, @Piso = @Piso, @Referencia = @Referencia`,
      {
        Accion: "A",
        IdArea: id,
        NombreArea: data.NombreArea,
        Piso: data.Piso || null,
        Referencia: data.Referencia || null,
      }
    );

    return NextResponse.json(updateResult.recordset[0] || { Mensaje: "Área actualizada correctamente." });
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

    const permanent = searchParams.get("permanent") === "1" || searchParams.get("permanent") === "true";
    const accion = permanent ? "D" : "E";

    try {
      const result = await executeQuery(
        `EXEC sp_MantenimientoArea @Accion = @Accion, @IdArea = @IdArea`,
        {
          Accion: accion,
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
    } catch (err: any) {
      // If the stored procedure raised an error (RAISERROR), forward the message
      const msg = (err && err.message) || "Error al eliminar el área";
      console.error("Error al ejecutar sp_MantenimientoArea (DELETE):", err);
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (error) {
    console.error("Error en DELETE /api/areas:", error);
    return NextResponse.json(
      { error: "Error al desactivar el área" },
      { status: 500 }
    );
  }
}

