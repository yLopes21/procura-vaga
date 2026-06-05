import { describe, it, expect } from "vitest";
import { normalizeLocation } from "./location";

describe("normalizeLocation", () => {
  it.each([
    ["São Paulo, SP", { uf: "SP", city: "São Paulo", remote: false }],
    ["Rio de Janeiro - RJ", { uf: "RJ", city: "Rio de Janeiro", remote: false }],
    ["Belo Horizonte, MG", { uf: "MG", city: "Belo Horizonte", remote: false }],
    ["Curitiba, Paraná", { uf: "PR", city: "Curitiba", remote: false }],
  ])("'%s' → UF correta com cidade acentuada", (raw, expected) => {
    expect(normalizeLocation(raw)).toEqual(expected);
  });

  it.each([
    ["Remoto"],
    ["Remote - Brazil"],
    ["Home Office"],
    ["Trabalho à distância"],
  ])("'%s' → remote=true", (raw) => {
    expect(normalizeLocation(raw).remote).toBe(true);
  });

  it("vaga remota com UF declarada mantém ambos", () => {
    expect(normalizeLocation("São Paulo, SP (Remoto)")).toEqual({
      uf: "SP",
      city: "São Paulo",
      remote: true,
    });
  });

  it.each([
    ["USA, Miami"],
    ["Lisboa, Portugal"],
    ["Buenos Aires, Argentina"],
    ["Brasil"],
    ["", ],
    ["Local a combinar"],
  ])("'%s' → UF null (nunca atribui UF errada)", (raw) => {
    expect(normalizeLocation(raw as string).uf).toBeNull();
  });

  it("null/undefined → vazio seguro", () => {
    expect(normalizeLocation(null)).toEqual({ uf: null, city: null, remote: false });
  });

  it("nome de capital sem sigla resolve a UF", () => {
    expect(normalizeLocation("Salvador").uf).toBe("BA");
  });
});
