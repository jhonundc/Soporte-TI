import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "@/lib/auth/jwt";

describe("jwt", () => {
  it("firma y verifica un token válido", async () => {
    const payload = { id: 1, username: "admin", role: "Administrador" };
    const token = await signToken(payload);
    const verified = await verifyToken(token);

    expect(verified).toMatchObject(payload);
  });

  it("retorna null para token inválido", async () => {
    const verified = await verifyToken("token.invalido");
    expect(verified).toBeNull();
  });

  it("retorna null para token vacío", async () => {
    const verified = await verifyToken("");
    expect(verified).toBeNull();
  });
});
