import { describe, expect, it } from "vitest";
import {
  fichaBuscarQuerySchema,
  fichaCreateApiSchema,
  fichaDeleteQuerySchema,
  fichaListQuerySchema,
  fichaUpdateApiSchema,
} from "@/lib/validations/ficha.schema";

describe("fichaCreateApiSchema", () => {
  it("requiere NumeroFicha", () => {
    const result = fichaCreateApiSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("acepta payload mínimo de creación", () => {
    const result = fichaCreateApiSchema.parse({ NumeroFicha: "FS-2026-001" });
    expect(result.NumeroFicha).toBe("FS-2026-001");
  });
});

describe("fichaUpdateApiSchema", () => {
  it("requiere IdSoporte positivo", () => {
    const result = fichaUpdateApiSchema.safeParse({ IdSoporte: 0 });
    expect(result.success).toBe(false);
  });

  it("acepta acciones de workflow", () => {
    const result = fichaUpdateApiSchema.parse({ IdSoporte: 10, Accion: "C" });
    expect(result.Accion).toBe("C");
  });
});

describe("fichaDeleteQuerySchema", () => {
  it("coerce id desde string", () => {
    const result = fichaDeleteQuerySchema.parse({ id: "15" });
    expect(result.id).toBe(15);
  });
});

describe("fichaBuscarQuerySchema", () => {
  it("rechaza búsqueda vacía", () => {
    const result = fichaBuscarQuerySchema.safeParse({ q: "   " });
    expect(result.success).toBe(false);
  });
});

describe("fichaListQuerySchema", () => {
  it("normaliza flags abiertos/cerrados", () => {
    const result = fichaListQuerySchema.parse({ abiertos: "true", cerrados: "0" });
    expect(result.abiertos).toBe(true);
    expect(result.cerrados).toBe(false);
  });
});
