import { describe, expect, it } from "vitest";
import {
  bienCreateApiSchema,
  bienFormSchema,
  bienToggleApiSchema,
  bienUpdateApiSchema,
} from "@/lib/validations/bienes.schema";

describe("bienFormSchema", () => {
  it("requiere descripción mínima y al menos un código", () => {
    const invalid = bienFormSchema.safeParse({
      Descripcion: "PC",
      CodigoInventario: "",
      CodigoPatrimonial: "",
    });
    expect(invalid.success).toBe(false);
  });

  it("acepta datos mínimos válidos", () => {
    const valid = bienFormSchema.safeParse({
      CodigoInventario: "INV-001",
      Descripcion: "Computadora de escritorio",
    });
    expect(valid.success).toBe(true);
  });
});

describe("bienCreateApiSchema", () => {
  it("requiere al menos un código de inventario o patrimonial", () => {
    const result = bienCreateApiSchema.safeParse({
      Descripcion: "Monitor",
      CodigoInventario: null,
      CodigoPatrimonial: null,
    });
    expect(result.success).toBe(false);
  });

  it("normaliza ids numéricos desde string", () => {
    const result = bienCreateApiSchema.parse({
      CodigoInventario: "INV-100",
      Descripcion: "Impresora",
      IdCategoria: "2",
      IdMarca: "5",
    });
    expect(result.IdCategoria).toBe(2);
    expect(result.IdMarca).toBe(5);
  });
});

describe("bienToggleApiSchema", () => {
  it("valida toggle activo/inactivo", () => {
    const result = bienToggleApiSchema.parse({ IdBien: 1, Activo: false });
    expect(result.Activo).toBe(false);
  });
});

describe("bienUpdateApiSchema", () => {
  it("rechaza PATCH sin campos actualizables", () => {
    const result = bienUpdateApiSchema.safeParse({ IdBien: 1 });
    expect(result.success).toBe(false);
  });

  it("permite toggle solo con Activo", () => {
    const result = bienUpdateApiSchema.safeParse({ IdBien: 1, Activo: true });
    expect(result.success).toBe(true);
  });
});
