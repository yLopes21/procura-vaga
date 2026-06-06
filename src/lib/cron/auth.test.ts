import { describe, it, expect } from "vitest";
import { isAuthorizedCron } from "./auth";

const SECRET = "0123456789abcdef0123456789abcdef"; // >=16

describe("isAuthorizedCron", () => {
  it("aceita 'Bearer <secret>' correto", () => {
    expect(isAuthorizedCron(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it("rejeita secret errado", () => {
    expect(isAuthorizedCron("Bearer errado-errado-errado-errado", SECRET)).toBe(false);
  });

  it("rejeita header ausente (null)", () => {
    expect(isAuthorizedCron(null, SECRET)).toBe(false);
  });

  it("rejeita sem o prefixo Bearer", () => {
    expect(isAuthorizedCron(SECRET, SECRET)).toBe(false);
  });

  it("fail-closed: secret vazio nunca autoriza (mesmo com Bearer válido no header)", () => {
    expect(isAuthorizedCron("Bearer ", "")).toBe(false);
    expect(isAuthorizedCron(`Bearer ${SECRET}`, "")).toBe(false);
  });

  it("comprimentos diferentes não autorizam (e não lançam)", () => {
    expect(isAuthorizedCron("Bearer x", SECRET)).toBe(false);
  });
});
