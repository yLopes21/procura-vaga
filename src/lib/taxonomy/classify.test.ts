import { describe, it, expect } from "vitest";
import { classifyEmploymentType, classifySeniority } from "./classify";

describe("classifyEmploymentType", () => {
  it.each([
    ["Estágio em Marketing", "estagio"],
    ["Estagiário de RH", "estagio"],
    ["Programa de Estágio 2026", "estagio"],
    ["Software Engineering Intern", "estagio"],
    ["Internship - Data", "estagio"],
    ["Programa Trainee 2026", "trainee"],
    ["Jovem Aprendiz Administrativo", "trainee"],
    ["Analista de Marketing Júnior", "efetivo"],
    ["Desenvolvedor Pleno", "efetivo"],
    ["Gerente de Vendas", "efetivo"],
  ])("'%s' → %s", (title, expected) => {
    expect(classifyEmploymentType(title)).toBe(expected);
  });

  it("não classifica 'internacional' como estágio (falso positivo)", () => {
    expect(classifyEmploymentType("Vaga Internacional de Vendas")).toBe("efetivo");
  });

  it("sinais conflitantes (estágio + trainee) → unknown", () => {
    expect(classifyEmploymentType("Estágio / Trainee confuso")).toBe("unknown");
  });

  it("título vazio → unknown", () => {
    expect(classifyEmploymentType("")).toBe("unknown");
  });
});

describe("classifySeniority", () => {
  it.each([
    ["Analista Júnior", "junior"],
    ["Desenvolvedor Jr", "junior"],
    ["Dev Pleno", "pleno"],
    ["Engenheiro Sênior", "senior"],
    ["Tech Lead", "senior"],
    ["Especialista em Dados", "senior"],
    ["Analista de Marketing", "unknown"],
  ])("'%s' → %s", (title, expected) => {
    expect(classifySeniority(title)).toBe(expected);
  });
});
