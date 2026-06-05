import { describe, it, expect } from "vitest";
import { getDb, schema } from "./index";

/**
 * Garante a inicialização preguiçosa do cliente Drizzle (PM-05).
 * O cliente NÃO deve ser construído no import do módulo — só na 1ª chamada de
 * getDb() — para que importar uma rota sem DATABASE_URL não derrube o processo
 * no carregamento (cold start serverless), e sim no ponto de uso com erro claro.
 * (O ambiente de teste roda sem DATABASE_URL, então este arquivo só consegue
 * importar ./index no topo PORQUE a construção é lazy.)
 */
describe("getDb (cliente Drizzle lazy)", () => {
  it("importar o módulo não lança mesmo sem DATABASE_URL (lazy)", async () => {
    await expect(import("./index")).resolves.toHaveProperty("getDb");
  });

  it("getDb() lança erro claro quando DATABASE_URL está ausente", () => {
    expect(() => getDb()).toThrow(/DATABASE_URL/);
  });

  it("reexporta o schema (estático, independe de env)", () => {
    expect(schema.jobs).toBeDefined();
  });
});
