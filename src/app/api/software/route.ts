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

function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function buildLookupMapFromOptions(rows: any[], idKeys: string[], labelKeys: string[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const row of rows || []) {
    const id = idKeys.map((k) => parseNullableInt(row?.[k])).find((v) => v !== null) ?? null;
    const label = labelKeys.map((k) => toNullableString(row?.[k])).find((v) => !!v) ?? null;
    if (id !== null && label) {
      map.set(normalizeKey(label), id);
    }
  }

  return map;
}

function resolveCatalogId(explicitId: unknown, labelValue: unknown, lookup: Map<string, number>): number | null {
  const id = parseNullableInt(explicitId);
  if (id !== null) return id;
  const key = normalizeKey(labelValue);
  if (!key) return null;
  return lookup.get(key) ?? null;
}

async function resolveSoftwarePayloadIds(data: any) {
  const [
    softwareCatalogoResult,
    tiposSoftwareResult,
    proveedoresResult,
    tiposLicenciaResult,
    estadosLicenciaResult,
    tiposAsignacionResult,
  ] = await Promise.all([
    executeQuery("SELECT IdSoftwareCatalogo, NombreSoftware FROM SoftwareCatalogo WHERE Activo = 1"),
    executeQuery("SELECT IdTipoSoftware, TipoSoftware FROM TipoSoftware WHERE Activo = 1"),
    executeQuery("SELECT IdProveedor, Proveedor FROM Proveedores WHERE Activo = 1"),
    executeQuery("SELECT IdTipoLicencia, TipoLicencia FROM TipoLicencia WHERE Activo = 1"),
    executeQuery("SELECT IdEstadoLicencia, EstadoLicencia FROM EstadosLicencia WHERE Activo = 1"),
    executeQuery("SELECT IdTipoAsignacion, TipoAsignacion FROM TipoAsignacionSoftware WHERE Activo = 1"),
  ]);

  const softwareCatalogoMap = buildLookupMapFromOptions(
    softwareCatalogoResult.recordset || [],
    ["IdSoftwareCatalogo"],
    ["NombreSoftware"]
  );
  const tiposSoftwareMap = buildLookupMapFromOptions(
    tiposSoftwareResult.recordset || [],
    ["IdTipoSoftware"],
    ["TipoSoftware"]
  );
  const proveedoresMap = buildLookupMapFromOptions(
    proveedoresResult.recordset || [],
    ["IdProveedor"],
    ["Proveedor", "NombreProveedor"]
  );
  const tiposLicenciaMap = buildLookupMapFromOptions(
    tiposLicenciaResult.recordset || [],
    ["IdTipoLicencia"],
    ["TipoLicencia"]
  );
  const estadosLicenciaMap = buildLookupMapFromOptions(
    estadosLicenciaResult.recordset || [],
    ["IdEstadoLicencia"],
    ["EstadoLicencia"]
  );
  const tiposAsignacionMap = buildLookupMapFromOptions(
    tiposAsignacionResult.recordset || [],
    ["IdTipoAsignacion"],
    ["TipoAsignacion"]
  );

  const idSoftwareCatalogo = resolveCatalogId(
    data.IdSoftwareCatalogo,
    data.NombreSoftware,
    softwareCatalogoMap
  );
  const idTipoSoftware = resolveCatalogId(data.IdTipoSoftware, data.TipoSoftware, tiposSoftwareMap);
  const idProveedor = resolveCatalogId(data.IdProveedor, data.ProveedorEntidad, proveedoresMap);
  const idTipoLicencia = resolveCatalogId(data.IdTipoLicencia, data.TipoLicencia, tiposLicenciaMap);
  const idEstadoLicencia = resolveCatalogId(data.IdEstadoLicencia, data.EstadoLicencia, estadosLicenciaMap);
  const idTipoAsignacion = resolveCatalogId(
    data.IdTipoAsignacion,
    data.EquiposUsuariosAsignados ?? data.TipoAsignacion,
    tiposAsignacionMap
  );

  const errors: string[] = [];
  if (!idSoftwareCatalogo) errors.push("Software inexistente o inactivo.");
  if (!idTipoSoftware) errors.push("Tipo de software inexistente o inactivo.");
  if (!idProveedor) errors.push("Proveedor inexistente o inactivo.");
  if (!idTipoLicencia) errors.push("Tipo de licencia inexistente o inactivo.");
  if (!idEstadoLicencia) errors.push("Estado de licencia inexistente o inactivo.");
  if (!idTipoAsignacion) errors.push("Tipo de asignación inexistente o inactivo.");

  const versionSoftware = toNullableString(data.VersionSoftware);
  const cantidadLicencias = parseNullableInt(data.CantidadLicencias);

  if (!versionSoftware) errors.push("La versión es obligatoria.");
  if ((cantidadLicencias ?? 0) <= 0) errors.push("La cantidad de licencias debe ser mayor a cero.");

  return {
    ids: {
      IdSoftwareCatalogo: idSoftwareCatalogo,
      IdTipoSoftware: idTipoSoftware,
      IdProveedor: idProveedor,
      IdTipoLicencia: idTipoLicencia,
      IdEstadoLicencia: idEstadoLicencia,
      IdTipoAsignacion: idTipoAsignacion,
      VersionSoftware: versionSoftware,
      CantidadLicencias: cantidadLicencias,
      FechaCaducidad: data.FechaCaducidad || null,
      UsoFinalidad: toNullableString(data.UsoFinalidad),
    },
    errors,
  };
}

function formatSoftwareRow(row: any) {
  return {
    IdSoftware: row.IdSoftware,
    NombreSoftware: row.NombreSoftware ?? row.Software ?? row.Nombre,
    TipoSoftware: row.TipoSoftware ?? row.Tipo,
    VersionSoftware: row.VersionSoftware,
    ProveedorEntidad: row.ProveedorEntidad ?? row.Proveedor ?? row.NombreProveedor,
    TipoLicencia: row.TipoLicencia ?? row.Licencia,
    CantidadLicencias: row.CantidadLicencias,
    EstadoLicencia: row.EstadoLicencia ?? row.Estado,
    FechaCaducidad: row.FechaCaducidad,
    EquiposUsuariosAsignados: row.EquiposUsuariosAsignados ?? row.TipoAsignacion,
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

    const resolved = await resolveSoftwarePayloadIds(data);
    if (resolved.errors.length) {
      return NextResponse.json(
        { error: resolved.errors.join(" ") },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `EXEC sp_MantenimientoSoftware
        @Accion = @Accion,
        @IdSoftwareCatalogo = @IdSoftwareCatalogo,
        @IdTipoSoftware = @IdTipoSoftware,
        @VersionSoftware = @VersionSoftware,
        @IdProveedor = @IdProveedor,
        @IdTipoLicencia = @IdTipoLicencia,
        @CantidadLicencias = @CantidadLicencias,
        @IdEstadoLicencia = @IdEstadoLicencia,
        @FechaCaducidad = @FechaCaducidad,
        @IdTipoAsignacion = @IdTipoAsignacion,
        @UsoFinalidad = @UsoFinalidad`,
      {
        Accion: "R",
        ...resolved.ids,
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

    const resolved = await resolveSoftwarePayloadIds(data);
    if (resolved.errors.length) {
      return NextResponse.json(
        { error: resolved.errors.join(" ") },
        { status: 400 }
      );
    }

    await executeQuery(
      `EXEC sp_MantenimientoSoftware
        @Accion = @Accion,
        @IdSoftware = @IdSoftware,
        @IdSoftwareCatalogo = @IdSoftwareCatalogo,
        @IdTipoSoftware = @IdTipoSoftware,
        @VersionSoftware = @VersionSoftware,
        @IdProveedor = @IdProveedor,
        @IdTipoLicencia = @IdTipoLicencia,
        @CantidadLicencias = @CantidadLicencias,
        @IdEstadoLicencia = @IdEstadoLicencia,
        @FechaCaducidad = @FechaCaducidad,
        @IdTipoAsignacion = @IdTipoAsignacion,
        @UsoFinalidad = @UsoFinalidad`,
      {
        Accion: "A",
        IdSoftware: idSoftware,
        ...resolved.ids,
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
