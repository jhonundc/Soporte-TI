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

    if (!data.EstadoBien) {
      return NextResponse.json(
        { error: "El nombre del estado es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO EstadosDelBien (EstadoBien, Activo) 
       OUTPUT INSERTED.* 
       VALUES (@EstadoBien, 1)`,
      {
        EstadoBien: data.EstadoBien,
      }
    );

    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/estados:", error);
    return NextResponse.json(
      { error: "Error al crear el estado" },
      { status: 500 }
    );
  }
}

