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

  const normalized = {
    ...record,
    CodigoPatrimonial:
      record.CodigoPatrimonial ??
      record.codigoPatrimonial ??
      record.Bien?.CodigoPatrimonial ??
      record.Bien?.codigoPatrimonial ??
      record.Codigo_Patrimonial ??
      record.Bien?.Codigo_Patrimonial ??
      null,
    CodigoInventario:
      record.CodigoInventario ??
      record.codigoInventario ??
      record.Bien?.CodigoInventario ??
      record.Bien?.codigoInventario ??
      null,
    BienDescripcion:
      record.BienDescripcion ??
      record.DescripcionBien ??
      record.Bien?.Descripcion ??
      record.Descripcion ??
      null,
    Area:
      typeof record.Area === "string"
        ? { NombreArea: record.Area }
        : record.Area ?? null,
  };

  if (normalized.Marca && typeof normalized.Marca === "object") {
    normalized.Marca = normalized.Marca.Marca ?? "";
  }
  if (normalized.EstadoEquipo && typeof normalized.EstadoEquipo === "object") {
    normalized.EstadoEquipo = normalized.EstadoEquipo.EstadoEquipo ?? "";
  }

  return normalized;
}

function isIgnorableCodigoPatrimonial(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  return [
    "",
    "sin asignación",
    "sin asignacion",
    "sin-asignacion",
    "sinasignación",
    "sinasignacion",
  ].includes(normalized.replace(/\s+/g, " "));
}

async function enrichBienArea(records: any[]) {
  if (!records.length) return records;

  const patrimonios = Array.from(
    new Set(
      records
        .map((record) => String(record?.CodigoPatrimonial ?? "").trim())
        .filter((value) => value && !isIgnorableCodigoPatrimonial(value))
    )
  );

  if (!patrimonios.length) return records;

  const params: Record<string, unknown> = {};
  const paramNames = patrimonios.map((patrimonio, index) => {
    const key = `CodigoPatrimonial${index}`;
    params[key] = patrimonio;
    return `@${key}`;
  });

  const bienesResult = await executeQuery(
    `SELECT IdBien, CodigoInventario, CodigoPatrimonial, Descripcion, IdArea FROM Bienes WHERE CodigoPatrimonial IN (${paramNames.join(",")})`,
    params
  );

  const bienRows = bienesResult.recordset || [];
  const areasIds = Array.from(
    new Set(bienRows.map((bien: any) => bien.IdArea).filter((id: any) => id != null))
  ) as number[];

  const areasResult = areasIds.length
    ? await executeQuery(
        `SELECT IdArea, NombreArea, Piso, Referencia, Activo FROM Areas WHERE IdArea IN (${areasIds.join(",")})`
      )
    : { recordset: [] };

  const bienMap = new Map(
    bienRows.map((bien: any) => [String(bien.CodigoPatrimonial ?? "").trim(), bien])
  );
  const areaMap = new Map(
    (areasResult.recordset || []).map((area: any) => [area.IdArea, area])
  );

  return records.map((record) => {
    const codigo = String(record?.CodigoPatrimonial ?? "").trim();
    const matchedBien = codigo ? bienMap.get(codigo) : null;
    const matchedArea = matchedBien?.IdArea ? areaMap.get(matchedBien.IdArea) : null;

    return {
      ...record,
      Bien: matchedBien
        ? {
            IdBien: matchedBien.IdBien,
            CodigoInventario: matchedBien.CodigoInventario,
            CodigoPatrimonial: matchedBien.CodigoPatrimonial,
            Descripcion: matchedBien.Descripcion,
            IdArea: matchedBien.IdArea,
            Area: matchedArea
              ? {
                  IdArea: matchedArea.IdArea,
                  NombreArea: matchedArea.NombreArea,
                  Piso: matchedArea.Piso,
                  Referencia: matchedArea.Referencia,
                  Activo: matchedArea.Activo,
                }
              : null,
          }
        : record.Bien ?? null,
      Area: matchedArea
        ? {
            IdArea: matchedArea.IdArea,
            NombreArea: matchedArea.NombreArea,
            Piso: matchedArea.Piso,
            Referencia: matchedArea.Referencia,
            Activo: matchedArea.Activo,
          }
        : record.Area ?? null,
      BienDescripcion:
        record.BienDescripcion || matchedBien?.Descripcion || record.Descripcion || null,
    };
  });
}

const VALID_BIEN_COMPONENTE_ACTIONS = new Set(["L", "I", "P", "C", "A", "M", "S", "U", "E", "T", "D"]);

function buildBienComponenteParams(action: string, overrides: Record<string, any> = {}): Record<string, unknown> {
  return {
    Accion: action,
    IdBienComponente: null,
    CodigoPatrimonial: null,
    IdComponente: null,
    IdArea: null,
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

function normalizePatrimonialCode(value: any) {
  const input = String(value ?? "").trim();
  if (!input) return "SIN ASIGNACIÓN";
  const normalized = input.toLowerCase();
  if (["sin asignación", "sin-asignacion", "sin-asignación", "sinasignación"].includes(normalized.replace(/\s+/g, ""))) {
    return "SIN ASIGNACIÓN";
  }
  return input;
}

async function loadComponentesCatalogMap() {
  const catalogResult = await executeQuery(`EXEC sp_ConsultaComponente @Accion = @Accion`, {
    Accion: "A",
  });

  return (catalogResult.recordset || []).reduce((map: Record<string, string>, item: any) => {
    const id = item?.IdComponente != null ? String(item.IdComponente) : null;
    if (id) {
      map[id] = item.NombreComponente ?? map[id] ?? "";
    }
    return map;
  }, {});
}

async function enrichComponentes(records: any[], componenteNames: Record<string, string> = {}) {
  return records.map((record: any) => {
    const normalized = normalizeComponentesRecord(record);
    if (!normalized.NombreComponente && normalized.IdComponente != null) {
      normalized.NombreComponente = componenteNames[String(normalized.IdComponente)] || normalized.NombreComponente;
    }
    return normalized;
  });
}

export async function GET(request: Request) {
  const auth = await authSession();
  if (guardFailed(auth)) return auth;

  try {
    const url = new URL(request.url);
    const catalog = url.searchParams.get("catalog") === "true";
    const requestedAction = (url.searchParams.get("accion") || "").trim().toUpperCase();
    const codigoParam = url.searchParams.get("codigoPatrimonial");
    const serieParam = url.searchParams.get("serie");
    const idBienComponenteParam = parseNullableInt(url.searchParams.get("idBienComponente"));
    const idComponenteParam = parseNullableInt(url.searchParams.get("idComponente"));
    const idAreaParam = parseNullableInt(url.searchParams.get("idArea"));
    const marcaParam = url.searchParams.get("marca");
    const usuarioAsignadoParam = url.searchParams.get("usuarioAsignado");
    const estadoEquipoParam = url.searchParams.get("estadoEquipo");

    if (catalog) {
      const result = await executeQuery(`EXEC sp_ConsultaComponente @Accion = @Accion`, {
        Accion: "L",
      });
      return NextResponse.json(result.recordset || []);
    }

    let action = requestedAction && VALID_BIEN_COMPONENTE_ACTIONS.has(requestedAction) ? requestedAction : "L";

    if (!requestedAction) {
      if (idBienComponenteParam) {
        action = "I";
      } else if (codigoParam) {
        action = "P";
      } else if (idComponenteParam) {
        action = "C";
      } else if (idAreaParam) {
        action = "A";
      } else if (marcaParam) {
        action = "M";
      } else if (serieParam) {
        action = "S";
      } else if (usuarioAsignadoParam) {
        action = "U";
      } else if (estadoEquipoParam) {
        action = "E";
      }
    }

    const params = buildBienComponenteParams(action);

    if (action === "I") {
      if (!idBienComponenteParam) {
        return NextResponse.json(
          { error: "idBienComponente es requerido para la acción I" },
          { status: 400 }
        );
      }

      params.IdBienComponente = idBienComponenteParam;
      const single = await executeQuery(
        `EXEC sp_ConsultaBienComponente @Accion = @Accion, @IdBienComponente = @IdBienComponente`,
        params
      );
      const enrichedSingle = await enrichComponentes(single.recordset || []);
      return NextResponse.json(enrichedSingle[0] || null);
    }

    if (action === "P" && codigoParam) {
      (params as Record<string, unknown>).CodigoPatrimonial = codigoParam;
    } else if (action === "C" && idComponenteParam) {
      (params as Record<string, unknown>).IdComponente = idComponenteParam;
    } else if (action === "A") {
      if (idAreaParam === null) {
        return NextResponse.json(
          { error: "idArea es requerido para la acción A" },
          { status: 400 }
        );
      }
      (params as Record<string, unknown>).IdArea = idAreaParam;
    } else if (action === "M" && marcaParam) {
      (params as Record<string, unknown>).Marca = marcaParam;
    } else if (action === "S" && serieParam) {
      (params as Record<string, unknown>).Serie = serieParam;
    } else if (action === "U" && usuarioAsignadoParam) {
      (params as Record<string, unknown>).UsuarioAsignado = usuarioAsignadoParam;
    } else if (action === "E" && estadoEquipoParam) {
      (params as Record<string, unknown>).EstadoEquipo = estadoEquipoParam;
    }

    const result = await executeQuery(
      `EXEC sp_ConsultaBienComponente
        @Accion = @Accion,
        @IdBienComponente = @IdBienComponente,
        @CodigoPatrimonial = @CodigoPatrimonial,
        @IdComponente = @IdComponente,
        @IdArea = @IdArea,
        @Marca = @Marca,
        @Serie = @Serie,
        @UsuarioAsignado = @UsuarioAsignado,
        @EstadoEquipo = @EstadoEquipo`,
      params
    );

    const componenteNames = await loadComponentesCatalogMap();
    const enrichedRecords = await enrichComponentes(result.recordset || [], componenteNames);
    const enrichedWithBienArea = await enrichBienArea(enrichedRecords);
    return NextResponse.json(enrichedWithBienArea);
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
      buildBienComponenteParams("R", {
        CodigoPatrimonial: normalizePatrimonialCode(data.CodigoPatrimonial),
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

    return NextResponse.json({ success: true, action: "R" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error en POST /api/componentes:", error);
    return NextResponse.json(
      { error: message || "Error al registrar el componente del bien" },
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
      return NextResponse.json({ success: true, action: data.Activo ? "T" : "E" });
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
        CodigoPatrimonial: normalizePatrimonialCode(data.CodigoPatrimonial),
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

    return NextResponse.json({ success: true, action: "A" });
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
      buildBienComponenteParams("D", {
        IdBienComponente: idBienComponente,
        IdUsuario: session.id,
      })
    );

    return NextResponse.json({ success: true, action: "D" });
  } catch (error) {
    console.error("Error en DELETE /api/componentes:", error);
    return NextResponse.json(
      { error: "Error al eliminar el componente del bien" },
      { status: 500 }
    );
  }
}
