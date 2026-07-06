import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

function parseNullableInt(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

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

// Crear un nuevo bien
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("[API] POST /api/bienes payload:", JSON.stringify(data));
    
    // Validaciones básicas
    if (!data.CodigoInventario && !data.CodigoPatrimonial) {
      return NextResponse.json(
        { error: "Debe proporcionar al menos un código (Inventario o Patrimonial)" },
        { status: 400 }
      );
    }

    const fechaCompra = data.FechaCompra ? new Date(data.FechaCompra) : null;
    if (fechaCompra && isNaN(fechaCompra.getTime())) {
      return NextResponse.json(
        { error: "Fecha de compra inválida" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const paramsForCreate = {
      CodigoInventario: data.CodigoInventario || null,
      CodigoPatrimonial: data.CodigoPatrimonial || null,
      IdCategoria: parseNullableInt(data.IdCategoria),
      IdMarca: parseNullableInt(data.IdMarca),
      IdArea: parseNullableInt(data.IdArea),
      Modelo: data.Modelo ? String(data.Modelo).trim() : null,
      NumeroSerie: data.NumeroSerie || null,
      Descripcion: data.Descripcion || null,
      IdCondicion: parseNullableInt(data.IdCondicion),
      IdEstadoBien: parseNullableInt(data.IdEstadoBien),
      FechaCompra: fechaCompra,
      IdUsuario: payload.id,
    };
    console.log('[API] POST /api/bienes params:', Object.keys(paramsForCreate).reduce((acc:any,k)=>{acc[k]=typeof (paramsForCreate as any)[k]; return acc},{}));
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
  try {
    const data = await request.json();
    console.log("[API] PATCH /api/bienes payload:", JSON.stringify(data));
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { IdBien, ...fields } = data;
    
    if (!IdBien) {
      return NextResponse.json(
        { error: "Debe proporcionar el IdBien" },
        { status: 400 }
      );
    }

    // Si solo viene Activo, es una actualización de estado (Activar/Desactivar)
    if (Object.keys(fields).length === 1 && "Activo" in fields) {
      await executeQuery(
        `EXEC sp_MantenimientoBien 
          @Accion = @Accion,
          @IdBien = @IdBien,
          @IdUsuario = @IdUsuario`,
        {
          IdBien: parseInt(IdBien),
          IdUsuario: payload.id,
          Accion: fields.Activo ? "T" : "E",
        }
      );
      return NextResponse.json({ success: true });
    }

    const params: Record<string, any> = { 
      IdBien: parseNullableInt(IdBien),
      CodigoInventario: fields.CodigoInventario || null,
      CodigoPatrimonial: fields.CodigoPatrimonial || null,
      IdCategoria: parseNullableInt(fields.IdCategoria),
      IdMarca: parseNullableInt(fields.IdMarca),
      IdArea: parseNullableInt(fields.IdArea),
      Modelo: fields.Modelo ? String(fields.Modelo).trim() : null,
      NumeroSerie: fields.NumeroSerie || null,
      Descripcion: fields.Descripcion || null,
      IdCondicion: parseNullableInt(fields.IdCondicion),
      IdEstadoBien: parseNullableInt(fields.IdEstadoBien),
      FechaCompra: fields.FechaCompra ? new Date(fields.FechaCompra) : null,
      IdUsuarioModificacion: payload.id,
    };
    console.log('[API] PATCH /api/bienes params types:', Object.keys(params).reduce((acc:any,k)=>{acc[k]=typeof (params as any)[k]; return acc},{}));

    const hasUpdateFields = [
      "CodigoInventario",
      "CodigoPatrimonial",
      "IdCategoria",
      "IdMarca",
      "IdArea",
      "Modelo",
      "NumeroSerie",
      "Descripcion",
      "IdCondicion",
      "IdEstadoBien",
      "FechaCompra",
    ].some((key) => fields[key] !== undefined);

    if (!hasUpdateFields) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

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
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Debe proporcionar el ID del bien" },
        { status: 400 }
      );
    }

    await executeQuery(`EXEC sp_MantenimientoBien 
        @Accion = @Accion,
        @IdBien = @IdBien,
        @IdUsuario = @IdUsuario`, {
      IdBien: parseInt(id),
      IdUsuario: payload.id,
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

