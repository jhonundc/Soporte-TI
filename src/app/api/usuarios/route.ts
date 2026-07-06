import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { requireAdmin, requireAuth } from "@/lib/auth/guards";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const result = await executeQuery(`
      SELECT u.IdUsuario, u.Usuario, u.Nombres, u.Cargo, u.IdRol, u.Activo, u.FechaCreacion, r.NombreRol 
      FROM Usuarios u
      INNER JOIN Roles r ON u.IdRol = r.IdRol
      ORDER BY u.Nombres ASC
    `);
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error en GET /api/usuarios:", error);
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const data = await request.json();
    if (!data.Usuario || !data.Clave || !data.Nombres || !data.IdRol) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // Verificar si el usuario ya existe
    const existing = await executeQuery("SELECT IdUsuario FROM Usuarios WHERE Usuario = @Usuario", { Usuario: data.Usuario });
    if (existing.recordset.length > 0) {
      return NextResponse.json({ error: "El nombre de usuario ya existe" }, { status: 400 });
    }

    const hashedClave = await hashPassword(data.Clave);

    await executeQuery(`
      INSERT INTO Usuarios (Usuario, Clave, Nombres, Cargo, IdRol, Activo, FechaCreacion)
      VALUES (@Usuario, @Clave, @Nombres, @Cargo, @IdRol, 1, GETDATE())
    `, {
      Usuario: data.Usuario,
      Clave: hashedClave,
      Nombres: data.Nombres,
      Cargo: data.Cargo || null,
      IdRol: parseInt(data.IdRol)
    });

    return NextResponse.json({ success: true, message: "Usuario creado exitosamente" }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/usuarios:", error);
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const data = await request.json();
    if (!data.IdUsuario) {
      return NextResponse.json({ error: "IdUsuario es requerido" }, { status: 400 });
    }

    let queryText = `
      UPDATE Usuarios 
      SET Usuario = @Usuario, Nombres = @Nombres, Cargo = @Cargo, IdRol = @IdRol, Activo = @Activo
    `;
    const queryParams: any = {
      IdUsuario: parseInt(data.IdUsuario),
      Usuario: data.Usuario,
      Nombres: data.Nombres,
      Cargo: data.Cargo || null,
      IdRol: parseInt(data.IdRol),
      Activo: data.Activo ? 1 : 0
    };

    if (data.Clave && data.Clave.trim() !== "") {
      const hashedClave = await hashPassword(data.Clave);
      queryText += `, Clave = @Clave`;
      queryParams.Clave = hashedClave;
    }

    queryText += ` WHERE IdUsuario = @IdUsuario`;

    await executeQuery(queryText, queryParams);

    return NextResponse.json({ success: true, message: "Usuario actualizado" });
  } catch (error) {
    console.error("Error en PATCH /api/usuarios:", error);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "");

    if (isNaN(id)) {
      return NextResponse.json({ error: "IdUsuario es requerido" }, { status: 400 });
    }

    await executeQuery("DELETE FROM Usuarios WHERE IdUsuario = @IdUsuario", { IdUsuario: id });

    return NextResponse.json({ success: true, message: "Usuario eliminado" });
  } catch (error) {
    console.error("Error en DELETE /api/usuarios:", error);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}
