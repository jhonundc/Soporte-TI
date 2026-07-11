import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

type CatalogOption = {
  id: number;
  nombre: string;
};

function toNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function toNullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function buildUniqueOptions(rows: any[], idKeys: string[], nameKeys: string[]): CatalogOption[] {
  const map = new Map<number, string>();

  for (const row of rows || []) {
    const id = idKeys.map((k) => toNullableInt(row?.[k])).find((v) => v !== null) ?? null;
    const name = nameKeys.map((k) => toNullableText(row?.[k])).find((v) => !!v) ?? null;
    if (!id || !name) continue;
    map.set(id, name);
  }

  return Array.from(map.entries())
    .map(([id, nombre]) => ({ id, nombre }))
    .sort((a, b) => normalizeKey(a.nombre).localeCompare(normalizeKey(b.nombre), "es"));
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.id) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const marcasResult = await executeQuery("EXEC sp_ConsultaMarca @Accion = @Accion", { Accion: "L" });

    const marcas = buildUniqueOptions(marcasResult.recordset || [], ["IdMarca"], ["Marca"]);

    return NextResponse.json({ marcas });
  } catch (error) {
    console.error("Error en GET /api/componentes/importar/catalogos:", error);
    return NextResponse.json({ error: "Error al obtener catálogos de importación" }, { status: 500 });
  }
}
