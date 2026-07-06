import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import {
  guardFailed,
  isAdminRole,
  requireRole,
  type SessionUser,
} from "@/lib/auth/guards";

describe("isAdminRole", () => {
  it("identifica rol administrador", () => {
    expect(isAdminRole("Administrador")).toBe(true);
    expect(isAdminRole("ADMIN")).toBe(true);
  });

  it("excluye roles de soporte", () => {
    expect(isAdminRole("Soporte TI")).toBe(false);
    expect(isAdminRole("soporte")).toBe(false);
  });
});

describe("requireRole", () => {
  const session: SessionUser = { id: 1, username: "user", role: "Administrador" };

  it("permite rol incluido en la lista", () => {
    expect(requireRole(session, ["Administrador"])).toBeNull();
  });

  it("rechaza rol no autorizado con 403", () => {
    const soporte: SessionUser = { ...session, role: "Soporte TI" };
    const result = requireRole(soporte, ["Administrador"]);

    expect(result).toBeInstanceOf(NextResponse);
    expect(result?.status).toBe(403);
  });
});

describe("guardFailed", () => {
  it("detecta NextResponse como fallo de guard", () => {
    const response = NextResponse.json({ error: "No autorizado" }, { status: 401 });
    expect(guardFailed(response)).toBe(true);
  });

  it("no marca sesión válida como fallo", () => {
    const session: SessionUser = { id: 1, username: "admin", role: "Administrador" };
    expect(guardFailed(session)).toBe(false);
  });
});
