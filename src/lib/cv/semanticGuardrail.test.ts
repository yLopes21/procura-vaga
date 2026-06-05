import { describe, it, expect } from "vitest";
import { checkSemanticGuardrail } from "./semanticGuardrail";

describe("checkSemanticGuardrail", () => {
  it("verbo de apoio → liderança é bloqueado (auxiliei → liderei)", () => {
    const v = checkSemanticGuardrail("Auxiliei na organização de eventos", "Liderei a organização de eventos");
    expect(v.some((x) => x.type === "verbo_inflado")).toBe(true);
  });

  it("sinônimo de mesma intensidade passa (auxiliei → ajudei)", () => {
    expect(checkSemanticGuardrail("Auxiliei no projeto", "Ajudei no projeto")).toHaveLength(0);
  });

  it("número inventado é bloqueado (sem número → '15 eventos')", () => {
    const v = checkSemanticGuardrail("Organizei eventos da empresa", "Organizei 15 eventos da empresa");
    expect(v.some((x) => x.type === "numero_inventado")).toBe(true);
  });

  it("número preservado passa (30% em ambos)", () => {
    expect(
      checkSemanticGuardrail("Aumentei vendas em 30%", "Responsável por aumento de 30% nas vendas"),
    ).toHaveLength(0);
  });

  it("reescrita honesta sem inflar nem inventar → sem violação", () => {
    expect(
      checkSemanticGuardrail(
        "Ajudei o time financeiro com relatórios",
        "Apoiei a equipe de finanças na elaboração de relatórios",
      ),
    ).toHaveLength(0);
  });

  it("acumula múltiplas violações (verbo + número)", () => {
    const v = checkSemanticGuardrail("Auxiliei a equipe", "Liderei a equipe de 8 pessoas");
    expect(v.length).toBeGreaterThanOrEqual(2);
  });
});
