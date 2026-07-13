import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

// Obtener todas las condiciones
export async function GET() {
  try {
    const result = await executeQuery(
      "SELECT * FROM CondicionesBien WHERE Activo = 1 ORDER BY Condicion ASC"
    );
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error en GET /api/condiciones:", error);
    return NextResponse.json(
      { error: "Error al obtener las condiciones" },
      { status: 500 }
    );
  }
}

// Crear una nueva condición
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.Condicion) {
      return NextResponse.json(
        { error: "El nombre de la condición es requerido" },
        { status: 400 }
      );
    }

    try {
      await executeQuery(
        `EXEC sp_MantenimientoCondicionBien @Accion = @Accion, @Condicion = @Condicion`,
        { Accion: "R", Condicion: data.Condicion }
      );

      const sel = await executeQuery(
        `SELECT TOP 1 IdCondicion, Condicion, Activo FROM CondicionesBien WHERE Condicion = @Condicion ORDER BY IdCondicion DESC`,
        { Condicion: data.Condicion }
      );

      return NextResponse.json(sel.recordset?.[0] ?? { success: true }, { status: 201 });
    } catch (err: any) {
      console.error("Error al ejecutar sp_MantenimientoCondicionBien (POST):", err);
      const msg = (err && err.message) || "Error al crear la condición";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (error) {
    console.error("Error en POST /api/condiciones:", error);
    return NextResponse.json(
      { error: "Error al crear la condición" },
      { status: 500 }
    );
  }
}

// Actualizar y activar/desactivar
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const id = data.IdCondicion ? parseInt(data.IdCondicion) : null;
    if (!id) return NextResponse.json({ error: "IdCondicion es requerido" }, { status: 400 });

    if (data.Activar === true || data.Activar === false) {
      const accion = data.Activar ? "T" : "E";
      try {
        const result = await executeQuery(
          `EXEC sp_MantenimientoCondicionBien @Accion = @Accion, @IdCondicion = @IdCondicion`,
          { Accion: accion, IdCondicion: id }
        );
        return NextResponse.json(result.recordset[0] || { Mensaje: accion === "T" ? "Condición activada" : "Condición desactivada" });
      } catch (err: any) {
        console.error("Error al ejecutar sp_MantenimientoCondicionBien (PATCH activar):", err);
        const msg = (err && err.message) || "Error al cambiar estado de la condición";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    if (!data.Condicion) return NextResponse.json({ error: "El nombre de la condición es requerido" }, { status: 400 });

    try {
      const updateResult = await executeQuery(
        `EXEC sp_MantenimientoCondicionBien @Accion = @Accion, @IdCondicion = @IdCondicion, @Condicion = @Condicion`,
        { Accion: "A", IdCondicion: id, Condicion: data.Condicion }
      );

      const msgRow = Array.isArray(updateResult?.recordset) && updateResult.recordset.length ? updateResult.recordset[0] : null;
      return NextResponse.json(msgRow || { Mensaje: "Condición actualizada" });
    } catch (err: any) {
      console.error("Error al ejecutar sp_MantenimientoCondicionBien (PATCH actualizar):", err);
      const msg = (err && err.message) || "Error al actualizar la condición";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (error) {
    console.error("Error en PATCH /api/condiciones:", error);
    return NextResponse.json({ error: "Error al actualizar la condición" }, { status: 500 });
  }
}

// Eliminar (soft o permanente)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "El ID es requerido" }, { status: 400 });

    const permanent = searchParams.get("permanent") === "1" || searchParams.get("permanent") === "true";
    const accion = permanent ? "D" : "E";

    try {
      const result = await executeQuery(
        `EXEC sp_MantenimientoCondicionBien @Accion = @Accion, @IdCondicion = @IdCondicion`,
        { Accion: accion, IdCondicion: parseInt(id) }
      );

      if (result.recordset.length === 0) return NextResponse.json({ error: "Condición no encontrada" }, { status: 404 });
      return NextResponse.json(result.recordset[0]);
    } catch (err: any) {
      console.error("Error al ejecutar sp_MantenimientoCondicionBien (DELETE):", err);
      const msg = (err && err.message) || "Error al eliminar la condición";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (error) {
    console.error("Error en DELETE /api/condiciones:", error);
    return NextResponse.json({ error: "Error al desactivar la condición" }, { status: 500 });
  }
}

