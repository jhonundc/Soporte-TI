import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

// Obtener todos los tipos de estación
export async function GET() {
  try {
    const result = await executeQuery(
      "SELECT * FROM TiposEstacion WHERE Activo = 1 ORDER BY TipoEstacion ASC"
    );
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error en GET /api/tipos-estacion:", error);
    return NextResponse.json(
      { error: "Error al obtener los tipos de estación" },
      { status: 500 }
    );
  }
}

// Crear un nuevo tipo de estación
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.TipoEstacion) {
      return NextResponse.json(
        { error: "El nombre del tipo de estación es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO TiposEstacion (TipoEstacion, Activo) 
       OUTPUT INSERTED.* 
       VALUES (@TipoEstacion, 1)`,
      {
        TipoEstacion: data.TipoEstacion,
      }
    );
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/tipos-estacion:", error);
    return NextResponse.json(
      { error: "Error al crear el tipo de estación" },
      { status: 500 }
    );
  }
}

