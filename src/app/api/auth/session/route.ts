import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { getSession } from "@/lib/auth/guards";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const userResult = await executeQuery(
      `EXEC dbo.sp_LoginUsuario
        @Accion = @Accion,
        @IdUsuario = @IdUsuario`,
      {
        Accion: "S",
        IdUsuario: session.id,
      }
    );
    const user = userResult.recordset?.[0];

    if (!user || !user.Activo) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.IdUsuario,
        username: user.Usuario,
        name: user.Nombres,
        role: session.role || "",
      },
    });
  } catch (error) {
    console.error("Error in session API:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
