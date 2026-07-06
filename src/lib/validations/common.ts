import { NextResponse } from "next/server";
import { z } from "zod";

export const nullableString = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((val) => {
    if (val === null || val === undefined) return null;
    const text = String(val).trim();
    return text.length ? text : null;
  });

export const nullableInt = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((val) => {
    if (val === null || val === undefined || val === "") return null;
    const parsed = typeof val === "number" ? val : parseInt(String(val), 10);
    return Number.isInteger(parsed) ? parsed : null;
  });

export const requiredString = z.string().trim().min(1, "Este campo es requerido");

export const requiredPositiveInt = z.coerce
  .number()
  .int("Debe ser un número entero")
  .positive("Debe ser un número válido");

export const optionalBooleanLike = z
  .union([z.boolean(), z.string(), z.null()])
  .optional()
  .transform((val) => {
    if (val === null || val === undefined || val === "") return null;
    if (typeof val === "boolean") return val;
    const text = String(val).toLowerCase();
    if (text === "1" || text === "true" || text === "yes") return true;
    if (text === "0" || text === "false" || text === "no") return false;
    return null;
  });

export const idQuerySchema = z.object({
  id: requiredPositiveInt,
});

export function validationError(error: z.ZodError) {
  const first = error.issues[0];
  return NextResponse.json(
    {
      error: first?.message || "Datos inválidos",
      details: error.flatten(),
    },
    { status: 400 }
  );
}

export async function parseJsonBody<T>(
  schema: z.ZodType<T>,
  request: Request
): Promise<{ data: T } | { error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { error: NextResponse.json({ error: "JSON inválido" }, { status: 400 }) };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: validationError(parsed.error) };
  return { data: parsed.data };
}

export function parseSearchParams<T>(
  schema: z.ZodType<T>,
  searchParams: URLSearchParams
): { data: T } | { error: NextResponse } {
  const obj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    obj[key] = value;
  });

  const parsed = schema.safeParse(obj);
  if (!parsed.success) return { error: validationError(parsed.error) };
  return { data: parsed.data };
}

export function searchParamsToObject(searchParams: URLSearchParams) {
  const obj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}
