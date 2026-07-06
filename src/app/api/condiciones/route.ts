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

    const result = await executeQuery(
      `INSERT INTO CondicionesBien (Condicion, Activo) 
       OUTPUT INSERTED.* 
       VALUES (@Condicion, 1)`,
      {
        Condicion: data.Condicion,
      }
    );
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/condiciones:", error);
    return NextResponse.json(
      { error: "Error al crear la condición" },
      { status: 500 }
    );
  }
}

