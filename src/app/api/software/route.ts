import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

function parseNullableInt(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function toNullableString(value: any): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function parseBooleanLike(value: any): boolean | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;
  const text = String(value).toLowerCase();
  if (text === "1" || text === "true" || text === "yes") return true;
  if (text === "0" || text === "false" || text === "no") return false;
  return null;
}

function formatSoftwareRow(row: any) {
  return {
    IdSoftware: row.IdSoftware,
    NombreSoftware: row.NombreSoftware,
    TipoSoftware: row.TipoSoftware,
    VersionSoftware: row.VersionSoftware,
    ProveedorEntidad: row.ProveedorEntidad,
    TipoLicencia: row.TipoLicencia,
    CantidadLicencias: row.CantidadLicencias,
    EstadoLicencia: row.EstadoLicencia,
    FechaCaducidad: row.FechaCaducidad,
    EquiposUsuariosAsignados: row.EquiposUsuariosAsignados,
    UsoFinalidad: row.UsoFinalidad,
    FechaRegistro: row.FechaRegistro,
    Activo: row.Activo,
  };
}

export async function GET(request: Request) {
  const auth = await authSession();
  if (guardFailed(auth)) return auth;

  try {
    const url = new URL(request.url);
    const idSoftware = parseNullableInt(url.searchParams.get("id"));
    const nombre = toNullableString(url.searchParams.get("nombre"));
    const tipo = toNullableString(url.searchParams.get("tipo"));
    const version = toNullableString(url.searchParams.get("version"));
    const proveedor = toNullableString(url.searchParams.get("proveedor"));
    const tipoLicencia = toNullableString(url.searchParams.get("tipoLicencia"));
    const estado = toNullableString(url.searchParams.get("estado"));
    const inactivos = parseBooleanLike(url.searchParams.get("inactivos"));
    const all = parseBooleanLike(url.searchParams.get("all"));
    const porVencer = parseBooleanLike(url.searchParams.get("porVencer"));

    let accion = "L";
    if (idSoftware) accion = "I";
    else if (nombre) accion = "N";
    else if (tipo) accion = "T";
    else if (version) accion = "V";
    else if (proveedor) accion = "P";
    else if (tipoLicencia) accion = "C";
    else if (estado) accion = "E";
    else if (porVencer) accion = "F";
    else if (all) accion = "A";
    else if (inactivos) accion = "D";

    const result = await executeQuery(
      `EXEC sp_ConsultaSoftware
        @Accion = @Accion,
        @IdSoftware = @IdSoftware,
        @NombreSoftware = @NombreSoftware,
        @TipoSoftware = @TipoSoftware,
        @VersionSoftware = @VersionSoftware,
        @ProveedorEntidad = @ProveedorEntidad,
        @TipoLicencia = @TipoLicencia,
        @EstadoLicencia = @EstadoLicencia`,
      {
        Accion: accion,
        IdSoftware: idSoftware,
        NombreSoftware: nombre,
        TipoSoftware: tipo,
        VersionSoftware: version,
        ProveedorEntidad: proveedor,
        TipoLicencia: tipoLicencia,
        EstadoLicencia: estado,
      }
    );

    const softs = (result.recordset || []).map(formatSoftwareRow);
    if (idSoftware) {
      return NextResponse.json(softs[0] ?? null);
    }
    return NextResponse.json(softs);
  } catch (error) {
    console.error("Error en GET /api/software:", error);
    return NextResponse.json(
      { error: "Error al obtener los software" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await adminSession();
  if (guardFailed(session)) return session;

  try {
    const data = await request.json();

    const requiredFields = [
      "NombreSoftware",
      "TipoSoftware",
      "VersionSoftware",
      "ProveedorEntidad",
      "TipoLicencia",
      "CantidadLicencias",
      "EstadoLicencia",
    ];

    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0) {
        return NextResponse.json(
          { error: `El campo ${field} es obligatorio.` },
          { status: 400 }
        );
      }
    }

    const result = await executeQuery(
      `EXEC sp_MantenimientoSoftware
        @Accion = @Accion,
        @NombreSoftware = @NombreSoftware,
        @TipoSoftware = @TipoSoftware,
        @VersionSoftware = @VersionSoftware,
        @ProveedorEntidad = @ProveedorEntidad,
        @TipoLicencia = @TipoLicencia,
        @CantidadLicencias = @CantidadLicencias,
        @EstadoLicencia = @EstadoLicencia,
        @FechaCaducidad = @FechaCaducidad,
        @EquiposUsuariosAsignados = @EquiposUsuariosAsignados,
        @UsoFinalidad = @UsoFinalidad`,
      {
        Accion: "R",
        NombreSoftware: String(data.NombreSoftware),
        TipoSoftware: String(data.TipoSoftware),
        VersionSoftware: String(data.VersionSoftware),
        ProveedorEntidad: String(data.ProveedorEntidad),
        TipoLicencia: String(data.TipoLicencia),
        CantidadLicencias: parseNullableInt(data.CantidadLicencias),
        EstadoLicencia: String(data.EstadoLicencia),
        FechaCaducidad: data.FechaCaducidad || null,
        EquiposUsuariosAsignados: data.EquiposUsuariosAsignados ? String(data.EquiposUsuariosAsignados) : null,
        UsoFinalidad: data.UsoFinalidad ? String(data.UsoFinalidad) : null,
      }
    );

    const created = result.recordset?.[0] ?? null;
    return NextResponse.json(created ?? { success: true }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/software:", error);
    const message = (error as any)?.message || "Error al crear el software";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await adminSession();
  if (guardFailed(session)) return session;

  try {
    const data = await request.json();
    const idSoftware = parseNullableInt(data.IdSoftware);
    if (!idSoftware) {
      return NextResponse.json({ error: "IdSoftware es requerido." }, { status: 400 });
    }

    if (Object.keys(data).length === 2 && typeof data.Activo !== "undefined") {
      await executeQuery(
        `EXEC sp_MantenimientoSoftware @Accion = @Accion, @IdSoftware = @IdSoftware`,
        { Accion: data.Activo ? "T" : "E", IdSoftware: idSoftware }
      );
      return NextResponse.json({ success: true });
    }

    const cantidadLicencias = parseNullableInt(data.CantidadLicencias);
    if (cantidadLicencias !== null && cantidadLicencias < 0) {
      return NextResponse.json(
        { error: "La cantidad de licencias no puede ser negativa." },
        { status: 400 }
      );
    }

    await executeQuery(
      `EXEC sp_MantenimientoSoftware
        @Accion = @Accion,
        @IdSoftware = @IdSoftware,
        @NombreSoftware = @NombreSoftware,
        @TipoSoftware = @TipoSoftware,
        @VersionSoftware = @VersionSoftware,
        @ProveedorEntidad = @ProveedorEntidad,
        @TipoLicencia = @TipoLicencia,
        @CantidadLicencias = @CantidadLicencias,
        @EstadoLicencia = @EstadoLicencia,
        @FechaCaducidad = @FechaCaducidad,
        @EquiposUsuariosAsignados = @EquiposUsuariosAsignados,
        @UsoFinalidad = @UsoFinalidad`,
      {
        Accion: "A",
        IdSoftware: idSoftware,
        NombreSoftware: String(data.NombreSoftware),
        TipoSoftware: String(data.TipoSoftware),
        VersionSoftware: String(data.VersionSoftware),
        ProveedorEntidad: String(data.ProveedorEntidad),
        TipoLicencia: String(data.TipoLicencia),
        CantidadLicencias: cantidadLicencias,
        EstadoLicencia: String(data.EstadoLicencia),
        FechaCaducidad: data.FechaCaducidad || null,
        EquiposUsuariosAsignados: data.EquiposUsuariosAsignados ? String(data.EquiposUsuariosAsignados) : null,
        UsoFinalidad: data.UsoFinalidad ? String(data.UsoFinalidad) : null,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PATCH /api/software:", error);
    const message = (error as any)?.message || "Error al actualizar el software";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await adminSession();
  if (guardFailed(session)) return session;

  try {
    const url = new URL(request.url);
    const idSoftware = parseNullableInt(url.searchParams.get("id"));
    if (!idSoftware) {
      return NextResponse.json({ error: "IdSoftware es requerido." }, { status: 400 });
    }

    await executeQuery(
      `EXEC sp_MantenimientoSoftware @Accion = @Accion, @IdSoftware = @IdSoftware`,
      { Accion: "E", IdSoftware: idSoftware }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/software:", error);
    const message = (error as any)?.message || "Error al desactivar el software";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
