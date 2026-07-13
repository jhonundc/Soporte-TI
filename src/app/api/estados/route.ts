import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

export async function GET() {
  try {
    const result = await executeQuery(
      "SELECT * FROM EstadosDelBien WHERE Activo = 1 ORDER BY EstadoBien ASC"
    );
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error en GET /api/estados:", error);
    return NextResponse.json(
      { error: "Error al obtener los estados" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.debug("POST /api/estados payload:", data);

    if (!data.EstadoBien) {
      return NextResponse.json(
        { error: "El nombre del estado es requerido" },
        { status: 400 }
      );
    }
    try {
      const result = await executeQuery(
        `EXEC sp_MantenimientoEstadoBien @Accion = @Accion, @EstadoBien = @EstadoBien`,
        { Accion: "R", EstadoBien: data.EstadoBien }
      );

      return NextResponse.json(result.recordset?.[0] ?? { success: true }, { status: 201 });
    } catch (err: any) {
      console.error("Error al ejecutar sp_MantenimientoEstadoBien (POST):", err);
      const msg = (err?.message) || (err?.originalError?.info?.message) || (err?.originalError?.message) || "Error al crear el estado";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (error) {
    console.error("Error en POST /api/estados:", error);
    return NextResponse.json(
      { error: "Error al crear el estado" },
      { status: 500 }
    );
  }
}

// Actualizar y activar/desactivar
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const id = data.IdEstadoBien ? parseInt(data.IdEstadoBien) : null;
    if (!id) return NextResponse.json({ error: "IdEstadoBien es requerido" }, { status: 400 });

    if (data.Activar === true || data.Activar === false) {
      const accion = data.Activar ? "T" : "E";
      try {
        const result = await executeQuery(
          `EXEC sp_MantenimientoEstadoBien @Accion = @Accion, @IdEstadoBien = @IdEstadoBien`,
          { Accion: accion, IdEstadoBien: id }
        );
        return NextResponse.json(result.recordset?.[0] || { Mensaje: accion === "T" ? "Estado activado" : "Estado desactivado" });
      } catch (err: any) {
        console.error("Error al ejecutar sp_MantenimientoEstadoBien (PATCH activar):", err);
        const msg = (err?.message) || (err?.originalError?.info?.message) || (err?.originalError?.message) || "Error al cambiar estado";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    if (!data.EstadoBien) return NextResponse.json({ error: "El nombre del estado es requerido" }, { status: 400 });

    try {
      const updateResult = await executeQuery(
        `EXEC sp_MantenimientoEstadoBien @Accion = @Accion, @IdEstadoBien = @IdEstadoBien, @EstadoBien = @EstadoBien`,
        { Accion: "A", IdEstadoBien: id, EstadoBien: data.EstadoBien }
      );

      const msgRow = Array.isArray(updateResult?.recordset) && updateResult.recordset.length ? updateResult.recordset[0] : null;
      return NextResponse.json(msgRow || { Mensaje: "Estado actualizado" });
    } catch (err: any) {
      console.error("Error al ejecutar sp_MantenimientoEstadoBien (PATCH actualizar):", err);
      const msg = (err?.message) || (err?.originalError?.info?.message) || (err?.originalError?.message) || "Error al actualizar el estado";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (error) {
    console.error("Error en PATCH /api/estados:", error);
    return NextResponse.json({ error: "Error al actualizar el estado" }, { status: 500 });
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
        `EXEC sp_MantenimientoEstadoBien @Accion = @Accion, @IdEstadoBien = @IdEstadoBien`,
        { Accion: accion, IdEstadoBien: parseInt(id) }
      );

      if (result.recordset?.length === 0) return NextResponse.json({ error: "Estado no encontrado" }, { status: 404 });
      return NextResponse.json(result.recordset[0]);
    } catch (err: any) {
      console.error("Error al ejecutar sp_MantenimientoEstadoBien (DELETE):", err);
      const msg = (err?.message) || (err?.originalError?.info?.message) || (err?.originalError?.message) || "Error al eliminar el estado";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (error) {
    console.error("Error en DELETE /api/estados:", error);
    return NextResponse.json({ error: "Error al desactivar el estado" }, { status: 500 });
  }
}

