import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

function parseNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function buildMaintenanceParams(action: string, baseParams: Record<string, unknown> = {}) {
  return {
    Accion: action,
    ...baseParams,
  };
}

export async function GET() {
  const auth = await authSession();
  if (guardFailed(auth)) return auth;

  try {
    const result = await executeQuery(`EXEC sp_ConsultaComponente @Accion = @Accion`, {
      Accion: "L",
    });
    return NextResponse.json(result.recordset || []);
  } catch (error) {
    console.error("Error en GET /api/componentes-catalogo:", error);
    return NextResponse.json(
      { error: "Error al obtener los componentes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await adminSession();
  if (guardFailed(session)) return session;

  try {
    const data = await request.json();

    if (!data.NombreComponente) {
      return NextResponse.json(
        { error: "El nombre del componente es requerido" },
        { status: 400 }
      );
    }

    const params = buildMaintenanceParams("R", {
      NombreComponente: String(data.NombreComponente).trim(),
    });

    const result = await executeQuery(
      `EXEC sp_MantenimientoComponente
        @Accion = @Accion,
        @NombreComponente = @NombreComponente`,
      params
    );

    return NextResponse.json(result.recordset?.[0] ?? { success: true }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/componentes-catalogo:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Error al crear el componente: ${message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await adminSession();
  if (guardFailed(session)) return session;

  try {
    const data = await request.json();
    const idComponente = parseNullableInt(data.IdComponente);

    if (!idComponente) {
      return NextResponse.json(
        { error: "El IdComponente es requerido" },
        { status: 400 }
      );
    }

    if (data.Activo === true || data.Activo === false) {
      const params = buildMaintenanceParams(data.Activo ? "T" : "E", {
        IdComponente: idComponente,
      });
      const result = await executeQuery(
        `EXEC sp_MantenimientoComponente
          @Accion = @Accion,
          @IdComponente = @IdComponente`,
        params
      );
      return NextResponse.json(result.recordset?.[0] ?? { success: true });
    }

    const params = buildMaintenanceParams("A", {
      IdComponente: idComponente,
      NombreComponente: data.NombreComponente ? String(data.NombreComponente).trim() : null,
    });

    const result = await executeQuery(
      `EXEC sp_MantenimientoComponente
        @Accion = @Accion,
        @IdComponente = @IdComponente,
        @NombreComponente = @NombreComponente`,
      params
    );
    return NextResponse.json(result.recordset?.[0] ?? { success: true });
  } catch (error) {
    console.error("Error en PATCH /api/componentes-catalogo:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Error al actualizar el componente: ${message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await adminSession();
  if (guardFailed(session)) return session;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "El id es requerido" },
        { status: 400 }
      );
    }

    const params = buildMaintenanceParams("E", {
      IdComponente: parseNullableInt(id),
    });

    const result = await executeQuery(
      `EXEC sp_MantenimientoComponente
        @Accion = @Accion,
        @IdComponente = @IdComponente`,
      params
    );
    return NextResponse.json(result.recordset?.[0] ?? { success: true });
  } catch (error) {
    console.error("Error en DELETE /api/componentes-catalogo:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Error al desactivar el componente: ${message}` },
      { status: 500 }
    );
  }
}
