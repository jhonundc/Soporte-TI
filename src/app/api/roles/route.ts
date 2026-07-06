import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

export async function GET() {
  try {
    const result = await executeQuery("SELECT IdRol, NombreRol, Activo FROM Roles WHERE Activo = 1 ORDER BY NombreRol ASC");
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error en GET /api/roles:", error);
    return NextResponse.json({ error: "Error al obtener roles" }, { status: 500 });
  }
}
