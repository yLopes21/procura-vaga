import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hash (scrypt, Node-only, fail-closed)", () => {
  const senha = "s3nh4-correta!";

  it("round-trip: verifyPassword(senha, hashPassword(senha)) → true", async () => {
    const stored = await hashPassword(senha);
    expect(await verifyPassword(senha, stored)).toBe(true);
  });

  it("senha errada → false", async () => {
    const stored = await hashPassword(senha);
    expect(await verifyPassword("senha-errada", stored)).toBe(false);
  });

  it("fail-closed: stored nulo/vazio/undefined → false", async () => {
    expect(await verifyPassword(senha, null)).toBe(false);
    expect(await verifyPassword(senha, "")).toBe(false);
    expect(await verifyPassword(senha, undefined)).toBe(false);
  });

  it("formato inválido (string sem prefixo scrypt) → false", async () => {
    expect(await verifyPassword(senha, "texto-qualquer-sem-formato")).toBe(false);
    expect(await verifyPassword(senha, "bcrypt$abc$def")).toBe(false);
    expect(await verifyPassword(senha, "scrypt$soSalt")).toBe(false);
  });

  it("o hash NÃO contém a senha em texto puro", async () => {
    const stored = await hashPassword(senha);
    expect(stored.includes(senha)).toBe(false);
  });

  it("salt aleatório: dois hashes da mesma senha são diferentes", async () => {
    const a = await hashPassword(senha);
    const b = await hashPassword(senha);
    expect(a).not.toBe(b);
  });

  it("senha vazia → throw", async () => {
    await expect(hashPassword("")).rejects.toThrow();
  });
});
