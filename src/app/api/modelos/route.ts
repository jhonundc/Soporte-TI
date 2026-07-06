import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

// Obtener todos los modelos
export async function GET() {
  try {
    const result = await executeQuery(
      `SELECT IdModelo, Modelo, Activo
       FROM Modelos
       ORDER BY Modelo ASC`
    );

    const modelos = result.recordset.map((row: any) => ({
      IdModelo: row.IdModelo,
      Modelo: row.Modelo,
      Activo: row.Activo,
    }));

    return NextResponse.json(modelos);
  } catch (error) {
    console.error("Error en GET /api/modelos:", error);
    return NextResponse.json(
      { error: "Error al obtener los modelos" },
      { status: 500 }
    );
  }
}

// Crear un nuevo modelo
export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.Modelo) {
      return NextResponse.json(
        { error: "El nombre del modelo es requerido" },
        { status: 400 }
      );
    }

    await executeQuery(
      `EXEC sp_MantenimientoModelo
         @Accion = @Accion,
         @Modelo = @Modelo`,
      { Accion: "R", Modelo: String(data.Modelo).trim() }
    );

    const created = await executeQuery(
      `SELECT TOP 1 IdModelo, Modelo, Activo
       FROM Modelos
       WHERE Modelo = @Modelo
       ORDER BY IdModelo DESC`,
      { Modelo: String(data.Modelo).trim() }
    );

    return NextResponse.json(created.recordset?.[0] ?? { success: true }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/modelos:", error);
    const msg = (error as any)?.message || String(error);
    return NextResponse.json(
      { error: `Error al crear el modelo: ${msg}` },
      { status: 500 }
    );
  }
}

// Actualizar un modelo
export async function PATCH(request: Request) {
  try {
    const data = await request.json();

    if (!data.IdModelo) {
      return NextResponse.json(
        { error: "El ID del modelo es requerido" },
        { status: 400 }
      );
    }

    const idModelo = parseInt(String(data.IdModelo), 10);
    const isToggle = data.Activo !== undefined && data.Modelo === undefined;

    if (isToggle) {
      await executeQuery(
        `EXEC sp_MantenimientoModelo
           @Accion = @Accion,
           @IdModelo = @IdModelo`,
        {
          Accion: data.Activo ? "T" : "E",
          IdModelo: idModelo,
        }
      );
    } else {
      if (!data.Modelo || !String(data.Modelo).trim()) {
        return NextResponse.json(
          { error: "El nombre del modelo es requerido" },
          { status: 400 }
        );
      }

      await executeQuery(
        `EXEC sp_MantenimientoModelo
           @Accion = @Accion,
           @IdModelo = @IdModelo,
           @Modelo = @Modelo`,
        {
          Accion: "A",
          IdModelo: idModelo,
          Modelo: String(data.Modelo).trim(),
        }
      );
    }

    const result = await executeQuery(
      `SELECT IdModelo, Modelo, Activo
       FROM Modelos
       WHERE IdModelo = @IdModelo`,
      { IdModelo: idModelo }
    );

    if (!result.recordset?.length) {
      return NextResponse.json({ error: "Modelo no encontrado" }, { status: 404 });
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en PATCH /api/modelos:", error);
    const msg = (error as any)?.message || String(error);
    return NextResponse.json(
      { error: `Error al actualizar el modelo: ${msg}` },
      { status: 500 }
    );
  }
}

// Desactivar un modelo (Soft Delete)
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

    const idModelo = parseInt(id, 10);

    await executeQuery(
      `EXEC sp_MantenimientoModelo
         @Accion = @Accion,
         @IdModelo = @IdModelo`,
      { Accion: "E", IdModelo: idModelo }
    );

    const result = await executeQuery(
      `SELECT IdModelo, Modelo, Activo
       FROM Modelos
       WHERE IdModelo = @IdModelo`,
      { IdModelo: idModelo }
    );

    if (!result.recordset?.length) {
      return NextResponse.json({ error: "Modelo no encontrado" }, { status: 404 });
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en DELETE /api/modelos:", error);
    const msg = (error as any)?.message || String(error);
    return NextResponse.json(
      { error: `Error al desactivar el modelo: ${msg}` },
      { status: 500 }
    );
  }
}

