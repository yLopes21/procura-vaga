import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./rateLimit";

describe("checkRateLimit (in-memory, best-effort, janela fixa)", () => {
  const base = 1_000_000; // instante-base determinístico (ms)

  it("(a) 5 chamadas na MESMA chave dentro da janela → allowed=true", () => {
    const key = "a:5-permitidas";
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, base).allowed).toBe(true);
    }
  });

  it("(b) a 6ª chamada na mesma janela → allowed=false", () => {
    const key = "b:6a-bloqueia";
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, base).allowed).toBe(true);
    }
    expect(checkRateLimit(key, base).allowed).toBe(false);
  });

  it("(c) reset: now no futuro (após a janela) zera a contagem → allowed=true", () => {
    const key = "c:reset-no-futuro";
    for (let i = 0; i < 6; i++) {
      checkRateLimit(key, base); // esgota a janela (6ª já bloqueada)
    }
    expect(checkRateLimit(key, base).allowed).toBe(false);

    // passa um `now` além da janela (60s): a contagem reseta
    const futuro = base + 60_000 + 1;
    expect(checkRateLimit(key, futuro).allowed).toBe(true);
  });
});
