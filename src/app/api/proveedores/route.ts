import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

export async function GET() {
  try {
    console.log("GET /api/proveedores called");
    const result = await executeQuery(
      "SELECT IdProveedor, Proveedor, Activo FROM Proveedores WHERE Activo = 1 ORDER BY Proveedor ASC"
    );
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error en GET /api/proveedores:", error);
    return NextResponse.json(
      { error: "Error al obtener los proveedores" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/proveedores called");
    const data = await request.json();

    if (!data.Proveedor) {
      return NextResponse.json(
        { error: "El nombre del proveedor es requerido" },
        { status: 400 }
      );
    }

    try {
      await executeQuery(
        `EXEC sp_MantenimientoProveedor @Accion = @Accion, @Proveedor = @Proveedor`,
        {
          Accion: "R",
          Proveedor: data.Proveedor,
        }
      );

      // Stored procedure does not return the inserted row, so fetch it
      const sel = await executeQuery(
        `SELECT TOP 1 IdProveedor, Proveedor, Activo FROM Proveedores WHERE Proveedor = @Proveedor ORDER BY IdProveedor DESC`,
        { Proveedor: data.Proveedor }
      );

      return NextResponse.json(sel.recordset?.[0] ?? { success: true }, { status: 201 });
    } catch (err: any) {
      console.error("Error al ejecutar sp_MantenimientoProveedor (POST):", err);
      const msg = (err && err.message) || "Error al registrar el proveedor";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (error) {
    console.error("Error en POST /api/proveedores:", error);
    return NextResponse.json(
      { error: "Error al registrar el proveedor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    console.log("PATCH /api/proveedores called");
    const data = await request.json();

    if (!data.IdProveedor || !data.Proveedor) {
      return NextResponse.json(
        { error: "El ID y el nombre del proveedor son requeridos" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `UPDATE Proveedores
       SET Proveedor = @Proveedor
       OUTPUT INSERTED.*
       WHERE IdProveedor = @IdProveedor`,
      {
        IdProveedor: parseInt(data.IdProveedor, 10),
        Proveedor: data.Proveedor,
      }
    );

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en PATCH /api/proveedores:", error);
    return NextResponse.json(
      { error: "Error al actualizar el proveedor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    console.log("DELETE /api/proveedores called");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "El ID es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `UPDATE Proveedores
       SET Activo = 0
       OUTPUT INSERTED.*
       WHERE IdProveedor = @IdProveedor`,
      {
        IdProveedor: parseInt(id, 10),
      }
    );

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en DELETE /api/proveedores:", error);
    return NextResponse.json(
      { error: "Error al desactivar el proveedor" },
      { status: 500 }
    );
  }
}
