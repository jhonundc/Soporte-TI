import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

function parseNullableInt(value: any): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

async function getUserIdFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !payload.id) return null;
  return payload.id;
}

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const idAreaParam = url.searchParams.get("idArea");

    // Get all areas
    const areasResult = await executeQuery(
      `SELECT IdArea, NombreArea FROM Areas ORDER BY NombreArea ASC`
    );

    const areas = areasResult.recordset || [];

    // If specific area selected, get components for that area
    if (idAreaParam) {
      const idArea = parseNullableInt(idAreaParam);
      if (!idArea) {
        return NextResponse.json(
          { error: "IdArea inválido" },
          { status: 400 }
        );
      }

      const componentesResult = await executeQuery(
        `SELECT DISTINCT 
          bc.IdBienComponente,
          bc.IdBien,
          bc.IdComponente,
          b.CodigoInventario,
          b.Descripcion AS BienDescripcion,
          c.NombreComponente,
          c.Modelo,
          c.NumeroSerie,
          c.Capacidad,
          m.Marca,
          ee.EstadoEquipo,
          b.IdArea,
          a.NombreArea
        FROM BienesComponentes bc
        INNER JOIN Bienes b ON bc.IdBien = b.IdBien
        INNER JOIN Componentes c ON bc.IdComponente = c.IdComponente
        INNER JOIN Areas a ON b.IdArea = a.IdArea
        LEFT JOIN Marcas m ON c.IdMarca = m.IdMarca
        LEFT JOIN EstadosEquipo ee ON bc.IdEstadoEquipo = ee.IdEstadoEquipo
        WHERE b.IdArea = @IdArea
        ORDER BY c.NombreComponente ASC`,
        { IdArea: idArea }
      );

      return NextResponse.json({
        area: areas.find((a: any) => a.IdArea === idArea),
        componentes: componentesResult.recordset || [],
      });
    }

    // If no specific area, get all components grouped by area
    const allComponentesResult = await executeQuery(
      `SELECT DISTINCT 
        bc.IdBienComponente,
        bc.IdBien,
        bc.IdComponente,
        b.CodigoInventario,
        b.Descripcion AS BienDescripcion,
        c.NombreComponente,
        c.Modelo,
        c.NumeroSerie,
        c.Capacidad,
        m.Marca,
        ee.EstadoEquipo,
        b.IdArea,
        a.NombreArea
      FROM BienesComponentes bc
      INNER JOIN Bienes b ON bc.IdBien = b.IdBien
      INNER JOIN Componentes c ON bc.IdComponente = c.IdComponente
      INNER JOIN Areas a ON b.IdArea = a.IdArea
      LEFT JOIN Marcas m ON c.IdMarca = m.IdMarca
      LEFT JOIN EstadosEquipo ee ON bc.IdEstadoEquipo = ee.IdEstadoEquipo
      ORDER BY a.NombreArea ASC, c.NombreComponente ASC`
    );

    return NextResponse.json({
      areas,
      componentes: allComponentesResult.recordset || [],
    });
  } catch (error: any) {
    console.error("Error en GET /api/soporte/componentes-por-area:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
