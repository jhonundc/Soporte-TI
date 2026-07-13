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
      `EXEC sp_MantenimientoMarca @Accion = @Accion, @Marca = @Marca`,
      {
        Accion: "R",
        Marca: data.Marca,
      }
    );

    return NextResponse.json(result.recordset[0] || { Mensaje: "Marca registrada" }, { status: 201 });
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
    
    const id = data.IdMarca ? parseInt(data.IdMarca) : null;
    if (!id) {
      return NextResponse.json(
        { error: "IdMarca es requerido" },
        { status: 400 }
      );
    }

    if (data.Activar === true || data.Activar === false) {
      const accion = data.Activar ? "T" : "E";
      const result = await executeQuery(
        `EXEC sp_MantenimientoMarca @Accion = @Accion, @IdMarca = @IdMarca`,
        { Accion: accion, IdMarca: id }
      );
      return NextResponse.json(result.recordset[0] || { Mensaje: accion === "T" ? "Marca activada" : "Marca desactivada" });
    }

    if (!data.Marca) {
      return NextResponse.json(
        { error: "El nombre de la marca es requerido para actualizar" },
        { status: 400 }
      );
    }

    const updateResult = await executeQuery(
      `EXEC sp_MantenimientoMarca @Accion = @Accion, @IdMarca = @IdMarca, @Marca = @Marca`,
      {
        Accion: "A",
        IdMarca: id,
        Marca: data.Marca,
      }
    );

    return NextResponse.json(updateResult.recordset[0] || { Mensaje: "Marca actualizada correctamente." });
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
    const permanent = searchParams.get("permanent") === "1" || searchParams.get("permanent") === "true";
    const accion = permanent ? "D" : "E";

    try {
      const result = await executeQuery(
        `EXEC sp_MantenimientoMarca @Accion = @Accion, @IdMarca = @IdMarca`,
        {
          Accion: accion,
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
    } catch (err: any) {
      const msg = (err && err.message) || "Error al eliminar la marca";
      console.error("Error al ejecutar sp_MantenimientoMarca (DELETE):", err);
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (error) {
    console.error("Error en DELETE /api/marcas:", error);
    return NextResponse.json(
      { error: "Error al desactivar la marca" },
      { status: 500 }
    );
  }
}

