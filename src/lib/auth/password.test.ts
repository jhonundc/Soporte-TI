import { describe, expect, it } from "vitest";
import { comparePassword, hashPassword } from "@/lib/auth/password";

describe("password", () => {
  it("genera hash distinto al texto plano", async () => {
    const hash = await hashPassword("ClaveSegura123");
    expect(hash).not.toBe("ClaveSegura123");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("comparePassword valida contraseña correcta", async () => {
    const plain = "Hospital2026!";
    const hash = await hashPassword(plain);
    await expect(comparePassword(plain, hash)).resolves.toBe(true);
  });

  it("comparePassword rechaza contraseña incorrecta", async () => {
    const hash = await hashPassword("correcta");
    await expect(comparePassword("incorrecta", hash)).resolves.toBe(false);
  });
});
