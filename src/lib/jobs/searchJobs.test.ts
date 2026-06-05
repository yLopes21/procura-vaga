import { describe, it, expect } from "vitest";
import { parseJobFilters } from "./searchJobs";

describe("parseJobFilters (filtros da busca a partir de searchParams)", () => {
  it("curso válido é mantido; inválido vira null", () => {
    expect(parseJobFilters({ curso: "administracao" }).course).toBe("administracao");
    expect(parseJobFilters({ curso: "ADMINISTRACAO" }).course).toBe("administracao");
    expect(parseJobFilters({ curso: "xyz" }).course).toBeNull();
    expect(parseJobFilters({}).course).toBeNull();
  });

  it("áreas só valem quando há curso (dependência)", () => {
    expect(parseJobFilters({ curso: "administracao", area: ["marketing", "rh"] }).subareas).toEqual([
      "marketing",
      "rh",
    ]);
    expect(parseJobFilters({ area: ["marketing"] }).subareas).toEqual([]); // sem curso → ignora
  });

  it("áreas inválidas (não pertencem ao curso) são descartadas", () => {
    expect(parseJobFilters({ curso: "administracao", area: ["marketing", "xyz"] }).subareas).toEqual(["marketing"]);
  });

  it("UF vira maiúscula; valor inválido vira null", () => {
    expect(parseJobFilters({ uf: "sp" }).uf).toBe("SP");
    expect(parseJobFilters({ uf: "xyz" }).uf).toBeNull();
  });

  it("tipos: mantém só valores válidos do enum (string ou array)", () => {
    expect(parseJobFilters({ tipo: "estagio,banana" }).types).toEqual(["estagio"]);
    expect(parseJobFilters({ tipo: ["estagio", "efetivo"] }).types).toEqual(["estagio", "efetivo"]);
  });

  it("remoto: '1' ou 'true' liga includeRemote", () => {
    expect(parseJobFilters({ remoto: "1" }).includeRemote).toBe(true);
    expect(parseJobFilters({ remoto: "true" }).includeRemote).toBe(true);
    expect(parseJobFilters({}).includeRemote).toBe(false);
  });
});
