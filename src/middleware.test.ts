import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// Lê o matcher REAL do middleware (o Next exige string literal estática lá, então
// não dá para importar a config no teste). Valida que os assets do PWA são públicos
// e que páginas/APIs do app exigem sessão. Pega o bug de matcher errado (Onda 12).
const src = readFileSync(new URL("./middleware.ts", import.meta.url), "utf-8");
// Captura a string COM escapes e resolve via JSON.parse, para o RegExp do teste
// interpretar `\\.` igual ao Next (que lê a string já parseada pelo JS).
const rawMatcher = src.match(/matcher:\s*\[\s*("(?:[^"\\]|\\.)*")\s*,?\s*\]/)?.[1];
const matcher = rawMatcher ? (JSON.parse(rawMatcher) as string) : undefined;

function isProtected(path: string): boolean {
  if (!matcher) throw new Error("matcher não encontrado em middleware.ts");
  return new RegExp(`^${matcher}$`).test(path);
}

describe("middleware matcher", () => {
  it("extrai o matcher do arquivo", () => {
    expect(matcher).toBeTruthy();
  });

  it("assets do PWA são PÚBLICOS (senão o app não instala)", () => {
    for (const p of [
      "/manifest.webmanifest",
      "/icon-192.png",
      "/icon-512.png",
      "/icon.png",
      "/apple-icon.png",
      "/sw.js",
      "/favicon.ico",
    ]) {
      expect(isProtected(p), `${p} deveria ser público`).toBe(false);
    }
  });

  it("login e rotas do Auth.js são públicos", () => {
    expect(isProtected("/login")).toBe(false);
    expect(isProtected("/api/auth/signin")).toBe(false);
  });

  it("páginas e APIs do app exigem sessão", () => {
    for (const p of ["/", "/busca", "/api/recruiter/draft", "/api/jobs/abc/validate"]) {
      expect(isProtected(p), `${p} deveria ser protegido`).toBe(true);
    }
  });
});
