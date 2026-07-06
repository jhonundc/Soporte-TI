import { describe, expect, it } from "vitest";
import {
  idQuerySchema,
  nullableInt,
  nullableString,
  optionalBooleanLike,
  parseJsonBody,
  parseSearchParams,
  requiredPositiveInt,
} from "@/lib/validations/common";

describe("nullableString", () => {
  it("convierte strings vacíos a null", () => {
    expect(nullableString.parse("   ")).toBeNull();
    expect(nullableString.parse("")).toBeNull();
  });

  it("recorta y conserva texto válido", () => {
    expect(nullableString.parse("  ABC  ")).toBe("ABC");
  });
});

describe("nullableInt", () => {
  it("parsea números desde string", () => {
    expect(nullableInt.parse("42")).toBe(42);
  });

  it("retorna null para valores inválidos", () => {
    expect(nullableInt.parse("abc")).toBeNull();
    expect(nullableInt.parse("")).toBeNull();
  });
});

describe("optionalBooleanLike", () => {
  it("normaliza valores truthy/falsy comunes", () => {
    expect(optionalBooleanLike.parse("1")).toBe(true);
    expect(optionalBooleanLike.parse("true")).toBe(true);
    expect(optionalBooleanLike.parse("0")).toBe(false);
    expect(optionalBooleanLike.parse("no")).toBe(false);
  });
});

describe("requiredPositiveInt", () => {
  it("rechaza cero y negativos", () => {
    expect(requiredPositiveInt.safeParse(0).success).toBe(false);
    expect(requiredPositiveInt.safeParse(-1).success).toBe(false);
  });

  it("acepta enteros positivos", () => {
    expect(requiredPositiveInt.parse("5")).toBe(5);
  });
});

describe("idQuerySchema", () => {
  it("valida id en query params", () => {
    const params = new URLSearchParams({ id: "10" });
    const result = parseSearchParams(idQuerySchema, params);
    expect("data" in result && result.data.id).toBe(10);
  });
});

describe("parseJsonBody", () => {
  it("retorna error 400 para JSON inválido", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: "not-json",
    });
    const result = await parseJsonBody(idQuerySchema, request);
    expect("error" in result && result.error.status).toBe(400);
  });

  it("parsea cuerpo JSON válido", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 3 }),
    });
    const result = await parseJsonBody(idQuerySchema, request);
    expect("data" in result && result.data.id).toBe(3);
  });
});
