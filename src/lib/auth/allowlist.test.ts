import { describe, it, expect } from "vitest";
import { isEmailAllowed } from "./allowlist";

describe("isEmailAllowed (allowlist server-side, fail-closed)", () => {
  const allowed = "rodrigo@gmail.com";

  it("email idêntico → permitido", () => {
    expect(isEmailAllowed("rodrigo@gmail.com", allowed)).toBe(true);
  });

  it("case e espaços ao redor não importam (normaliza)", () => {
    expect(isEmailAllowed("  Rodrigo@Gmail.com ", allowed)).toBe(true);
  });

  it("email diferente → negado", () => {
    expect(isEmailAllowed("outro@gmail.com", allowed)).toBe(false);
  });

  it("fail-closed: sem ALLOWED_EMAIL configurado → ninguém entra", () => {
    expect(isEmailAllowed("rodrigo@gmail.com", undefined)).toBe(false);
    expect(isEmailAllowed("rodrigo@gmail.com", "")).toBe(false);
  });

  it("fail-closed: email nulo/vazio → negado", () => {
    expect(isEmailAllowed(null, allowed)).toBe(false);
    expect(isEmailAllowed(undefined, allowed)).toBe(false);
    expect(isEmailAllowed("", allowed)).toBe(false);
  });
});
