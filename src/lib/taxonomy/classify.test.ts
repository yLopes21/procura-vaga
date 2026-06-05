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
    // efetivo SÓ com sinal positivo (senioridade ou termo de vínculo)
    ["Analista de Marketing Júnior", "efetivo"],
    ["Desenvolvedor Pleno", "efetivo"],
    ["Gerente de Vendas", "efetivo"],
    ["Engenheiro de Dados Sênior", "efetivo"],
    ["Desenvolvedor Full-time", "efetivo"],
    ["Vaga Efetiva — Analista CLT", "efetivo"],
  ])("'%s' → %s", (title, expected) => {
    expect(classifyEmploymentType(title)).toBe(expected);
  });

  // PM-02: sem sinal de estágio NEM de efetivo → unknown (nunca rotula errado).
  it.each([
    ["Vaga Internacional de Vendas", "unknown"],
    ["Programa de Talentos 2026", "unknown"],
    ["Banco de Talentos", "unknown"],
    ["Oportunidade para Estudantes", "unknown"],
  ])("ambíguo '%s' → %s (não vira 'efetivo' por padrão)", (title, expected) => {
    expect(classifyEmploymentType(title)).toBe(expected);
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
