import { describe, it, expect } from "vitest";
import { cineAreaFor, keywordsFor, keywordsForAreas, titleMatchesProfile } from "./match";

describe("keywordsForAreas (múltiplas áreas dependentes do curso)", () => {
  it("sem áreas → keywords gerais do curso", () => {
    expect(keywordsForAreas("administracao", [])).toContain("administra");
  });

  it("com áreas → união das keywords das áreas selecionadas", () => {
    const kws = keywordsForAreas("administracao", ["marketing", "rh"]);
    expect(kws).toContain("growth"); // de marketing
    expect(kws).toContain("recrutamento"); // de rh
  });

  it("curso inexistente → vazio", () => {
    expect(keywordsForAreas("xyz", ["marketing"])).toEqual([]);
  });
});

describe("taxonomia curso → área → keywords", () => {
  it("cineAreaFor resolve a área CINE do curso", () => {
    expect(cineAreaFor("administracao")).toBe("Negócios, administração e direito");
  });

  it("keywordsFor traz as keywords do curso", () => {
    expect(keywordsFor("administracao")).toContain("administra");
  });

  it("keywordsFor com subárea soma curso + subárea", () => {
    const kws = keywordsFor("administracao", "financeiro");
    expect(kws).toContain("controladoria");
    expect(kws).toContain("administra"); // mantém as do curso
  });

  it("curso inexistente → vazio e sem área", () => {
    expect(keywordsFor("curso-que-nao-existe")).toEqual([]);
    expect(cineAreaFor("curso-que-nao-existe")).toBeNull();
  });
});

describe("titleMatchesProfile", () => {
  it.each([
    ["Estágio em Controladoria Jr", { course: "administracao", subarea: "financeiro" }, true],
    ["Analista de Marketing", { course: "administracao", subarea: "marketing" }, true],
    ["Estágio em Administração", { course: "administracao" }, true],
    ["Estágio em Enfermagem", { course: "administracao" }, false],
    ["Desenvolvedor Backend", { course: "administracao", subarea: "financeiro" }, false],
  ])("'%s' (%o) → %s", (title, profile, expected) => {
    expect(titleMatchesProfile(title, profile)).toBe(expected);
  });

  it("ignora acentos/caixa ('Administração' casa 'administra')", () => {
    expect(titleMatchesProfile("ADMINISTRAÇÃO DE EMPRESAS", { course: "administracao" })).toBe(true);
  });
});
