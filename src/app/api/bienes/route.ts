import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";
import {
  bienCreateApiSchema,
  bienDeleteQuerySchema,
  bienToggleApiSchema,
  bienUpdateApiSchema,
  parseJsonBody,
  parseSearchParams,
} from "@/lib/validations";

<<<<<<< HEAD
function parseNullableInt(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}
=======
// Obtener todos los bienes
export async function GET() {
  const auth = await authSession();
  if (guardFailed(auth)) return auth;

  try {
    const result = await executeQuery(
      `EXEC sp_ConsultaBien @Accion = @Accion`,
      { Accion: "L" }
    );
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5

async function enrichBienes(baseRows: any[]) {
  if (!baseRows || baseRows.length === 0) return [];

  const marcasIds = Array.from(new Set(baseRows.map((r: any) => parseNullableInt(r.IdMarca)).filter((v) => v !== null))) as number[];
  const areasIds = Array.from(new Set(baseRows.map((r: any) => parseNullableInt(r.IdArea)).filter((v) => v !== null))) as number[];
  const condicionesIds = Array.from(new Set(baseRows.map((r: any) => parseNullableInt(r.IdCondicion)).filter((v) => v !== null))) as number[];
  const estadosIds = Array.from(new Set(baseRows.map((r: any) => parseNullableInt(r.IdEstadoBien)).filter((v) => v !== null))) as number[];
  const categoriasIds = Array.from(new Set(baseRows.map((r: any) => parseNullableInt(r.IdCategoria)).filter((v) => v !== null))) as number[];

  const [marcasResult, areasResult, condicionesResult, estadosResult, categoriasResult] = await Promise.all([
    marcasIds.length ? executeQuery(`SELECT IdMarca, Marca, Activo FROM Marcas WHERE IdMarca IN (${marcasIds.join(",")})`) : Promise.resolve({ recordset: [] }),
    areasIds.length ? executeQuery(`SELECT IdArea, NombreArea, Piso, Referencia, Activo FROM Areas WHERE IdArea IN (${areasIds.join(",")})`) : Promise.resolve({ recordset: [] }),
    condicionesIds.length ? executeQuery(`SELECT IdCondicion, Condicion, Activo FROM CondicionesBien WHERE IdCondicion IN (${condicionesIds.join(",")})`) : Promise.resolve({ recordset: [] }),
    estadosIds.length ? executeQuery(`SELECT IdEstadoBien, EstadoBien, Activo FROM EstadosDelBien WHERE IdEstadoBien IN (${estadosIds.join(",")})`) : Promise.resolve({ recordset: [] }),
    categoriasIds.length ? executeQuery(`SELECT IdCategoria, CategoriaBien, Activo FROM CategoriasBienes WHERE IdCategoria IN (${categoriasIds.join(",")})`) : Promise.resolve({ recordset: [] }),
  ]);

  const marcasMap = new Map((marcasResult.recordset || []).map((m: any) => [m.IdMarca, m]));
  const areasMap = new Map((areasResult.recordset || []).map((a: any) => [a.IdArea, a]));
  const condicionesMap = new Map((condicionesResult.recordset || []).map((c: any) => [c.IdCondicion, c]));
  const estadosMap = new Map((estadosResult.recordset || []).map((e: any) => [e.IdEstadoBien, e]));
  const categoriasMap = new Map((categoriasResult.recordset || []).map((cat: any) => [cat.IdCategoria, cat]));

  return baseRows.map((row: any) => {
    const marca = row.IdMarca ? marcasMap.get(row.IdMarca) : null;
    const area = row.IdArea ? areasMap.get(row.IdArea) : null;
    const condicion = row.IdCondicion ? condicionesMap.get(row.IdCondicion) : null;
    const estado = row.IdEstadoBien ? estadosMap.get(row.IdEstadoBien) : null;
    const categoria = row.IdCategoria ? categoriasMap.get(row.IdCategoria) : null;

    return {
      IdBien: row.IdBien,
      CodigoInventario: row.CodigoInventario,
      CodigoPatrimonial: row.CodigoPatrimonial,
      IdCategoria: row.IdCategoria,
      IdMarca: row.IdMarca,
      IdArea: row.IdArea,
      Modelo: row.Modelo,
      NumeroSerie: row.NumeroSerie,
      Descripcion: row.Descripcion,
      IdCondicion: row.IdCondicion,
      IdEstadoBien: row.IdEstadoBien,
      FechaCompra: row.FechaCompra,
      FechaRegistro: row.FechaRegistro,
      FechaModificacion: row.FechaModificacion,
      IdUsuarioRegistro: row.IdUsuarioRegistro,
      IdUsuarioModificacion: row.IdUsuarioModificacion,
      Activo: row.Activo,
      Marca: marca ? { IdMarca: marca.IdMarca, Marca: marca.Marca, Activo: marca.Activo } : null,
      Area: area ? { IdArea: area.IdArea, NombreArea: area.NombreArea, Piso: area.Piso, Referencia: area.Referencia, Activo: area.Activo } : null,
      Condicion: condicion ? { IdCondicion: condicion.IdCondicion, Condicion: condicion.Condicion, Activo: condicion.Activo } : null,
      Estado: estado ? { IdEstadoBien: estado.IdEstadoBien, EstadoBien: estado.EstadoBien, Activo: estado.Activo } : null,
      Categoria: categoria ? { IdCategoria: categoria.IdCategoria, CategoriaBien: categoria.CategoriaBien, Activo: categoria.Activo } : null,
    };
  });
}

// Obtener todos los bienes
export async function GET() {
  try {
    const result = await executeQuery(
      `EXEC sp_ConsultaBien @Accion = @Accion`,
      { Accion: "T" }
    );

    const bienes = await enrichBienes(result.recordset || []);
    return NextResponse.json(bienes);
  } catch (error) {
    console.error("Error en GET /api/bienes:", error);
    return NextResponse.json(
      { error: "Error al obtener los bienes" },
      { status: 500 }
    );
  }
}

<<<<<<< HEAD
// Crear un nuevo bien
=======
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5
export async function POST(request: Request) {
  const session = await adminSession();
  if (guardFailed(session)) return session;

  try {
    const parsed = await parseJsonBody(bienCreateApiSchema, request);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    const paramsForCreate = {
      CodigoInventario: data.CodigoInventario,
      CodigoPatrimonial: data.CodigoPatrimonial,
      IdCategoria: data.IdCategoria,
      IdMarca: data.IdMarca,
      IdArea: data.IdArea,
      Modelo: data.Modelo,
      NumeroSerie: data.NumeroSerie,
      Descripcion: data.Descripcion,
      IdCondicion: data.IdCondicion,
      IdEstadoBien: data.IdEstadoBien,
      FechaCompra: data.FechaCompra ?? null,
      IdUsuario: session.id,
    };
    const result = await executeQuery(
      `EXEC sp_MantenimientoBien 
        @Accion = @Accion,
        @CodigoInventario = @CodigoInventario, 
        @CodigoPatrimonial = @CodigoPatrimonial, 
        @IdCategoria = @IdCategoria, 
        @IdMarca = @IdMarca, 
        @IdArea = @IdArea, 
        @Modelo = @Modelo,
        @NumeroSerie = @NumeroSerie, 
        @Descripcion = @Descripcion, 
        @IdCondicion = @IdCondicion, 
        @IdEstadoBien = @IdEstadoBien, 
        @FechaCompra = @FechaCompra, 
        @IdUsuario = @IdUsuario`,
      { ...paramsForCreate, Accion: "R" }
    );

    const createdBien = result.recordset?.[0] ?? null;
    if (createdBien) {
      return NextResponse.json(createdBien, { status: 201 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/bienes:", error);
    const msg = (error as any)?.message || String(error);
    return NextResponse.json(
      { error: `Error al crear el bien: ${msg}` },
      { status: 500 }
    );
  }
}

// Actualizar un bien (Editar / Desactivar)
export async function PATCH(request: Request) {
  const session = await adminSession();
  if (guardFailed(session)) return session;

  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const toggleParsed = bienToggleApiSchema.safeParse(raw);
    if (
      toggleParsed.success &&
      typeof raw === "object" &&
      raw !== null &&
      Object.keys(raw).length === 2 &&
      "IdBien" in raw &&
      "Activo" in raw
    ) {
      const data = toggleParsed.data;
      await executeQuery(
        `EXEC sp_MantenimientoBien 
          @Accion = @Accion,
          @IdBien = @IdBien,
          @IdUsuario = @IdUsuario`,
        {
          IdBien: data.IdBien,
          IdUsuario: session.id,
          Accion: data.Activo ? "T" : "E",
        }
      );
      return NextResponse.json({ success: true });
    }

    const updateParsed = bienUpdateApiSchema.safeParse(raw);
    if (!updateParsed.success) {
      return NextResponse.json(
        { error: updateParsed.error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }
    const data = updateParsed.data;

    const params = {
      IdBien: data.IdBien,
      CodigoInventario: data.CodigoInventario ?? null,
      CodigoPatrimonial: data.CodigoPatrimonial ?? null,
      IdCategoria: data.IdCategoria ?? null,
      IdMarca: data.IdMarca ?? null,
      IdArea: data.IdArea ?? null,
      Modelo: data.Modelo ?? null,
      NumeroSerie: data.NumeroSerie ?? null,
      Descripcion: data.Descripcion ?? null,
      IdCondicion: data.IdCondicion ?? null,
      IdEstadoBien: data.IdEstadoBien ?? null,
      FechaCompra: data.FechaCompra ?? null,
      IdUsuarioModificacion: session.id,
    };

    await executeQuery(
      `EXEC sp_MantenimientoBien 
        @Accion = @Accion,
        @IdBien = @IdBien, 
        @CodigoInventario = @CodigoInventario, 
        @CodigoPatrimonial = @CodigoPatrimonial, 
        @IdCategoria = @IdCategoria, 
        @IdMarca = @IdMarca, 
        @IdArea = @IdArea, 
        @Modelo = @Modelo,
        @NumeroSerie = @NumeroSerie, 
        @Descripcion = @Descripcion, 
        @IdCondicion = @IdCondicion, 
        @IdEstadoBien = @IdEstadoBien, 
        @FechaCompra = @FechaCompra, 
        @IdUsuario = @IdUsuarioModificacion`,
      { ...params, Accion: "A" }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PATCH /api/bienes:", error);
    const msg = (error as any)?.message || String(error);
    return NextResponse.json(
      { error: `Error al actualizar el bien: ${msg}` },
      { status: 500 }
    );
  }
}

// Dar de baja un bien (eliminación lógica)
export async function DELETE(request: Request) {
  const session = await adminSession();
  if (guardFailed(session)) return session;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseSearchParams(bienDeleteQuerySchema, searchParams);
    if ("error" in parsed) return parsed.error;
    const id = parsed.data.id;

    await executeQuery(`EXEC sp_MantenimientoBien 
        @Accion = @Accion,
        @IdBien = @IdBien,
        @IdUsuario = @IdUsuario`, {
      IdBien: id,
      IdUsuario: session.id,
      Accion: "E",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/bienes:", error);
    const msg = (error as any)?.message || String(error);
    return NextResponse.json(
      { error: `Error al dar de baja el bien: ${msg}` },
      { status: 500 }
    );
  }
}

