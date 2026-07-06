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

async function enrichComponentes(records: any[]) {
  if (!records.length) return records;

  const bienIds = Array.from(
    new Set(records.map((r: any) => parseNullableInt(r.IdBien)).filter((id) => id !== null))
  );
  const componenteIds = Array.from(
    new Set(records.map((r: any) => parseNullableInt(r.IdComponente)).filter((id) => id !== null))
  );

  const [bienesResult, componentesResult] = await Promise.all([
    bienIds.length
      ? executeQuery(
          `SELECT IdBien, CodigoInventario, Descripcion FROM Bienes WHERE IdBien IN (${bienIds.join(",")})`
        )
      : Promise.resolve({ recordset: [] }),
    componenteIds.length
      ? executeQuery(
          `SELECT IdComponente, NombreComponente, Modelo FROM Componentes WHERE IdComponente IN (${componenteIds.join(",")})`
        )
      : Promise.resolve({ recordset: [] }),
  ]);

  const bienesMap = new Map((bienesResult.recordset || []).map((b: any) => [b.IdBien, b]));
  const componentesMap = new Map((componentesResult.recordset || []).map((c: any) => [c.IdComponente, c]));

  return records.map((record: any) =>
    normalizeComponentesRecord({
      ...record,
      BienDescripcion: bienesMap.get(record.IdBien)?.Descripcion || null,
      CodigoInventario: bienesMap.get(record.IdBien)?.CodigoInventario || null,
      NombreComponente: componentesMap.get(record.IdComponente)?.NombreComponente || null,
      ComponenteModelo: componentesMap.get(record.IdComponente)?.Modelo || null,
    })
  );
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
    const params: Record<string, any> = {
      Accion: action,
      CodigoPatrimonial: null,
      Serie: null,
    };

    if (idBienComponenteParam) {
      action = "I";
      params.Accion = action;
      params.IdBienComponente = idBienComponenteParam;
      const single = await executeQuery(
        `EXEC sp_ConsultaBienComponente @Accion = @Accion, @IdBienComponente = @IdBienComponente`,
        params
      );
      const enrichedSingle = await enrichComponentes(single.recordset || []);
      return NextResponse.json(enrichedSingle[0] || null);
    }

    if (codigoParam) {
      action = "P";
      params.Accion = action;
      params.CodigoPatrimonial = codigoParam;
    } else if (serieParam) {
      action = "S";
      params.Accion = action;
      params.Serie = serieParam;
    }

    const result = await executeQuery(
      `EXEC sp_ConsultaBienComponente
        @Accion = @Accion,
        @CodigoPatrimonial = @CodigoPatrimonial,
        @Serie = @Serie`,
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

    if (!data.IdBien || !data.IdComponente) {
      return NextResponse.json(
        { error: "IdBien e IdComponente son requeridos" },
        { status: 400 }
      );
    }

    await executeQuery(
      `EXEC sp_MantenimientoBienComponente
        @Accion = @Accion,
        @IdBien = @IdBien,
        @IdComponente = @IdComponente,
        @Observacion = @Observacion,
        @IdUsuario = @IdUsuario,
        @Cantidad = @Cantidad,
        @TipoEquipo = @TipoEquipo,
        @DescripcionModelo = @DescripcionModelo,
        @Marca = @Marca,
        @Serie = @Serie,
        @CodigoPatrimonial = @CodigoPatrimonial,
        @ProcesadorEspecificaciones = @ProcesadorEspecificaciones,
        @RAM = @RAM,
        @Almacenamiento = @Almacenamiento,
        @SistemaOperativo = @SistemaOperativo,
        @UbicacionFisica = @UbicacionFisica,
        @UsuarioAsignado = @UsuarioAsignado,
        @EstadoEquipo = @EstadoEquipo`,
      {
        Accion: "R",
        IdBien: parseNullableInt(data.IdBien),
        IdComponente: parseNullableInt(data.IdComponente),
        Observacion: data.Observacion || null,
        IdUsuario: session.id,
        Cantidad: parseNullableInt(data.Cantidad),
        TipoEquipo: data.TipoEquipo || null,
        DescripcionModelo: data.DescripcionModelo || null,
        Marca: data.Marca || null,
        Serie: data.Serie || null,
        CodigoPatrimonial: data.CodigoPatrimonial || null,
        ProcesadorEspecificaciones: data.ProcesadorEspecificaciones || null,
        RAM: data.RAM || null,
        Almacenamiento: data.Almacenamiento || null,
        SistemaOperativo: data.SistemaOperativo || null,
        UbicacionFisica: data.UbicacionFisica || null,
        UsuarioAsignado: data.UsuarioAsignado || null,
        EstadoEquipo: data.EstadoEquipo || null,
      }
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
        {
          Accion: data.Activo ? "T" : "E",
          IdBienComponente: idBienComponente,
          IdUsuario: session.id,
        }
      );
      return NextResponse.json({ success: true });
    }

    await executeQuery(
      `EXEC sp_MantenimientoBienComponente
        @Accion = @Accion,
        @IdBienComponente = @IdBienComponente,
        @IdBien = @IdBien,
        @IdComponente = @IdComponente,
        @Observacion = @Observacion,
        @IdUsuario = @IdUsuario,
        @Cantidad = @Cantidad,
        @TipoEquipo = @TipoEquipo,
        @DescripcionModelo = @DescripcionModelo,
        @Marca = @Marca,
        @Serie = @Serie,
        @CodigoPatrimonial = @CodigoPatrimonial,
        @ProcesadorEspecificaciones = @ProcesadorEspecificaciones,
        @RAM = @RAM,
        @Almacenamiento = @Almacenamiento,
        @SistemaOperativo = @SistemaOperativo,
        @UbicacionFisica = @UbicacionFisica,
        @UsuarioAsignado = @UsuarioAsignado,
        @EstadoEquipo = @EstadoEquipo`,
      {
        Accion: "A",
        IdBienComponente: idBienComponente,
        IdBien: parseNullableInt(data.IdBien),
        IdComponente: parseNullableInt(data.IdComponente),
        Observacion: data.Observacion || null,
        IdUsuario: session.id,
        Cantidad: parseNullableInt(data.Cantidad),
        TipoEquipo: data.TipoEquipo || null,
        DescripcionModelo: data.DescripcionModelo || null,
        Marca: data.Marca || null,
        Serie: data.Serie || null,
        CodigoPatrimonial: data.CodigoPatrimonial || null,
        ProcesadorEspecificaciones: data.ProcesadorEspecificaciones || null,
        RAM: data.RAM || null,
        Almacenamiento: data.Almacenamiento || null,
        SistemaOperativo: data.SistemaOperativo || null,
        UbicacionFisica: data.UbicacionFisica || null,
        UsuarioAsignado: data.UsuarioAsignado || null,
        EstadoEquipo: data.EstadoEquipo || null,
      }
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

    let idBienComponente = parseNullableInt(searchParams.get("idBienComponente"));

    if (!idBienComponente) {
      const idBien = parseNullableInt(searchParams.get("idBien"));
      const idComponente = parseNullableInt(searchParams.get("idComponente"));
      if (idBien && idComponente) {
        const result = await executeQuery(
          `SELECT TOP 1 IdBienComponente
           FROM BienesComponentes
           WHERE IdBien = @IdBien AND IdComponente = @IdComponente
           ORDER BY IdBienComponente DESC`,
          { IdBien: idBien, IdComponente: idComponente }
        );
        idBienComponente = parseNullableInt(result.recordset?.[0]?.IdBienComponente);
      }
    }

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
      { Accion: "E", IdBienComponente: idBienComponente, IdUsuario: session.id }
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
