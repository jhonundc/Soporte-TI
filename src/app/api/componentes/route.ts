import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

function parseNullableInt(value: any) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeComponentesRecord(record: any) {
  if (!record || typeof record !== "object") return record;
  const normalized = { ...record };
  if (normalized.Marca && typeof normalized.Marca === "object") {
    normalized.Marca = normalized.Marca.Marca ?? "";
  }
  if (normalized.EstadoEquipo && typeof normalized.EstadoEquipo === "object") {
    normalized.EstadoEquipo = normalized.EstadoEquipo.EstadoEquipo ?? "";
  }
  return normalized;
}

function buildBienComponenteParams(action: string, overrides: Record<string, any> = {}): Record<string, unknown> {
  return {
    Accion: action,
    IdBienComponente: null,
    CodigoPatrimonial: null,
    IdComponente: null,
    Observacion: null,
    IdUsuario: null,
    Cantidad: null,
    DescripcionModelo: null,
    Marca: null,
    Serie: null,
    ProcesadorEspecificaciones: null,
    RAM: null,
    Almacenamiento: null,
    SistemaOperativo: null,
    UbicacionFisica: null,
    UsuarioAsignado: null,
    EstadoEquipo: null,
    ...overrides,
  };
}

async function enrichComponentes(records: any[]) {
  if (!records.length) return records;

  const componenteIds = Array.from(
    new Set(records.map((r: any) => parseNullableInt(r.IdComponente)).filter((id) => id !== null))
  );
  const codigoPatrimoniales = Array.from(
    new Set(
      records
        .map((r: any) => String(r.CodigoPatrimonial ?? "").trim())
        .filter((value) => value.length > 0)
    )
  );

  const bienParams: Record<string, any> = {};
  const bienPlaceholders = codigoPatrimoniales.map((code, index) => {
    const key = `bien_${index}`;
    bienParams[key] = code;
    return `@${key}`;
  });

  const [bienesResult, componentesResult] = await Promise.all([
    codigoPatrimoniales.length
      ? executeQuery(
          `SELECT CodigoInventario, CodigoPatrimonial, Descripcion FROM Bienes WHERE CodigoPatrimonial IN (${bienPlaceholders.join(",")})`,
          bienParams
        )
      : Promise.resolve({ recordset: [] }),
    componenteIds.length
      ? executeQuery(
          `SELECT IdComponente, NombreComponente, Modelo FROM Componentes WHERE IdComponente IN (${componenteIds.join(",")})`
        )
      : Promise.resolve({ recordset: [] }),
  ]);

  const bienesMap = new Map(
    (bienesResult.recordset || []).map((b: any) => [String(b.CodigoPatrimonial ?? "").trim(), b])
  );
  const componentesMap = new Map((componentesResult.recordset || []).map((c: any) => [c.IdComponente, c]));

  return records.map((record: any) => {
    const codigoPatrimonial = String(record.CodigoPatrimonial ?? "").trim();
    const bien = bienesMap.get(codigoPatrimonial);

    return normalizeComponentesRecord({
      ...record,
      BienDescripcion: bien?.Descripcion || null,
      CodigoInventario: bien?.CodigoInventario || null,
      NombreComponente: componentesMap.get(record.IdComponente)?.NombreComponente || null,
      ComponenteModelo: componentesMap.get(record.IdComponente)?.Modelo || null,
    });
  });
}

export async function GET(request: Request) {
  const auth = await authSession();
  if (guardFailed(auth)) return auth;

  try {
    const url = new URL(request.url);
    const catalog = url.searchParams.get("catalog") === "true";
    const codigoParam = url.searchParams.get("codigoPatrimonial");
    const serieParam = url.searchParams.get("serie");
    const idBienComponenteParam = parseNullableInt(url.searchParams.get("idBienComponente"));

    if (catalog) {
      const result = await executeQuery(
        `SELECT IdComponente, NombreComponente, IdMarca, Modelo, NumeroSerie, Capacidad, Observacion, Cantidad, Activo
         FROM Componentes
         ORDER BY NombreComponente ASC`
      );
      return NextResponse.json(result.recordset);
    }

    let action = "L";
    const params = buildBienComponenteParams(action);

    if (idBienComponenteParam) {
      action = "I";
      const single = await executeQuery(
        `EXEC sp_ConsultaBienComponente @Accion = @Accion, @IdBienComponente = @IdBienComponente`,
        buildBienComponenteParams(action, { IdBienComponente: idBienComponenteParam })
      );
      const enrichedSingle = await enrichComponentes(single.recordset || []);
      return NextResponse.json(enrichedSingle[0] || null);
    }

    if (codigoParam) {
      action = "P";
      params.Accion = action;
      (params as Record<string, unknown>).CodigoPatrimonial = codigoParam;
    } else if (serieParam) {
      action = "S";
      params.Accion = action;
      (params as Record<string, unknown>).Serie = serieParam;
    }

    const result = await executeQuery(
      `EXEC sp_ConsultaBienComponente
        @Accion = @Accion,
        @IdBienComponente = @IdBienComponente,
        @CodigoPatrimonial = @CodigoPatrimonial,
        @IdComponente = @IdComponente,
        @Marca = @Marca,
        @Serie = @Serie,
        @UsuarioAsignado = @UsuarioAsignado,
        @EstadoEquipo = @EstadoEquipo`,
      params
    );

    const enrichedRecords = await enrichComponentes(result.recordset || []);
    return NextResponse.json(enrichedRecords);
  } catch (error) {
    console.error("Error en GET /api/componentes:", error);
    return NextResponse.json(
      { error: "Error al obtener los componentes de bienes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await adminSession();
  if (guardFailed(session)) return session;

  try {
    const data = await request.json();

    if (!data.IdComponente) {
      return NextResponse.json(
        { error: "IdComponente es requerido" },
        { status: 400 }
      );
    }

    await executeQuery(
      `EXEC sp_MantenimientoBienComponente
        @Accion = @Accion,
        @CodigoPatrimonial = @CodigoPatrimonial,
        @IdComponente = @IdComponente,
        @Observacion = @Observacion,
        @IdUsuario = @IdUsuario,
        @Cantidad = @Cantidad,
        @DescripcionModelo = @DescripcionModelo,
        @Marca = @Marca,
        @Serie = @Serie,
        @ProcesadorEspecificaciones = @ProcesadorEspecificaciones,
        @RAM = @RAM,
        @Almacenamiento = @Almacenamiento,
        @SistemaOperativo = @SistemaOperativo,
        @UbicacionFisica = @UbicacionFisica,
        @UsuarioAsignado = @UsuarioAsignado,
        @EstadoEquipo = @EstadoEquipo`,
      buildBienComponenteParams("R", {
        CodigoPatrimonial: data.CodigoPatrimonial && String(data.CodigoPatrimonial).trim() ? String(data.CodigoPatrimonial).trim() : "SIN-CODIGO-PATRIMONIAL",
        IdComponente: parseNullableInt(data.IdComponente),
        Observacion: data.Observacion || null,
        IdUsuario: session.id,
        Cantidad: parseNullableInt(data.Cantidad),
        DescripcionModelo: data.DescripcionModelo || null,
        Marca: data.Marca || null,
        Serie: data.Serie || null,
        ProcesadorEspecificaciones: data.ProcesadorEspecificaciones || null,
        RAM: data.RAM || null,
        Almacenamiento: data.Almacenamiento || null,
        SistemaOperativo: data.SistemaOperativo || null,
        UbicacionFisica: data.UbicacionFisica || null,
        UsuarioAsignado: data.UsuarioAsignado || null,
        EstadoEquipo: data.EstadoEquipo || null,
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en POST /api/componentes:", error);
    return NextResponse.json(
      { error: "Error al registrar el componente del bien" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await adminSession();
  if (guardFailed(session)) return session;

  try {
    const data = await request.json();

    const idBienComponente = parseNullableInt(data.IdBienComponente);

    if (!idBienComponente) {
      return NextResponse.json(
        { error: "IdBienComponente es requerido para actualizar" },
        { status: 400 }
      );
    }

    if (data.Activo === false || data.Activo === true) {
      await executeQuery(
        `EXEC sp_MantenimientoBienComponente
          @Accion = @Accion,
          @IdBienComponente = @IdBienComponente,
          @IdUsuario = @IdUsuario`,
        buildBienComponenteParams(data.Activo ? "T" : "E", {
          IdBienComponente: idBienComponente,
          IdUsuario: session.id,
        })
      );
      return NextResponse.json({ success: true });
    }

    await executeQuery(
      `EXEC sp_MantenimientoBienComponente
        @Accion = @Accion,
        @IdBienComponente = @IdBienComponente,
        @CodigoPatrimonial = @CodigoPatrimonial,
        @IdComponente = @IdComponente,
        @Observacion = @Observacion,
        @IdUsuario = @IdUsuario,
        @Cantidad = @Cantidad,
        @DescripcionModelo = @DescripcionModelo,
        @Marca = @Marca,
        @Serie = @Serie,
        @ProcesadorEspecificaciones = @ProcesadorEspecificaciones,
        @RAM = @RAM,
        @Almacenamiento = @Almacenamiento,
        @SistemaOperativo = @SistemaOperativo,
        @UbicacionFisica = @UbicacionFisica,
        @UsuarioAsignado = @UsuarioAsignado,
        @EstadoEquipo = @EstadoEquipo`,
      buildBienComponenteParams("A", {
        IdBienComponente: idBienComponente,
        CodigoPatrimonial: data.CodigoPatrimonial && String(data.CodigoPatrimonial).trim() ? String(data.CodigoPatrimonial).trim() : "SIN-CODIGO-PATRIMONIAL",
        IdComponente: parseNullableInt(data.IdComponente),
        Observacion: data.Observacion || null,
        IdUsuario: session.id,
        Cantidad: parseNullableInt(data.Cantidad),
        DescripcionModelo: data.DescripcionModelo || null,
        Marca: data.Marca || null,
        Serie: data.Serie || null,
        ProcesadorEspecificaciones: data.ProcesadorEspecificaciones || null,
        RAM: data.RAM || null,
        Almacenamiento: data.Almacenamiento || null,
        SistemaOperativo: data.SistemaOperativo || null,
        UbicacionFisica: data.UbicacionFisica || null,
        UsuarioAsignado: data.UsuarioAsignado || null,
        EstadoEquipo: data.EstadoEquipo || null,
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PATCH /api/componentes:", error);
    return NextResponse.json(
      { error: "Error al actualizar el componente del bien" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await adminSession();
  if (guardFailed(session)) return session;

  try {
    const { searchParams } = new URL(request.url);

    const idBienComponente = parseNullableInt(searchParams.get("idBienComponente"));

    if (!idBienComponente) {
      return NextResponse.json(
        { error: "idBienComponente es requerido para eliminar" },
        { status: 400 }
      );
    }

    await executeQuery(
      `EXEC sp_MantenimientoBienComponente
        @Accion = @Accion,
        @IdBienComponente = @IdBienComponente,
        @IdUsuario = @IdUsuario`,
      buildBienComponenteParams("E", {
        IdBienComponente: idBienComponente,
        IdUsuario: session.id,
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/componentes:", error);
    return NextResponse.json(
      { error: "Error al eliminar el componente del bien" },
      { status: 500 }
    );
  }
}
