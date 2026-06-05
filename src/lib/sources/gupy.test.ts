import { describe, it, expect } from "vitest";
import { parseGupy } from "./gupy";
import { rawJobSchema } from "./types";
import fixture from "./__fixtures__/gupy-portal.json";

describe("parseGupy (fixture real do portal Gupy)", () => {
  const jobs = parseGupy(fixture);

  it("extrai as 3 vagas de `data`", () => {
    expect(jobs).toHaveLength(3);
  });

  it("cada vaga satisfaz o contrato RawJobFromATS", () => {
    for (const j of jobs) expect(() => rawJobSchema.parse(j)).not.toThrow();
  });

  it("mapeia os campos crus (source, título, empresa, applyUrl)", () => {
    const first = jobs[0];
    expect(first.source).toBe("gupy");
    expect(first.sourceJobId).toBeTypeOf("string");
    expect(first.title).toMatch(/estágio/i);
    expect(first.company).toBeTruthy();
    expect(first.applyUrl).toMatch(/gupy\.io/);
  });

  it("monta locationRaw com cidade + estado (resolvível por location.ts)", () => {
    expect(jobs[0].locationRaw).toMatch(/São Paulo/);
  });

  it("traduz o type do Gupy para employmentTypeHint", () => {
    expect(jobs[0].employmentTypeHint).toBe("estagio");
  });

  it("fail loud: shape divergente lança (não retorna vazio em silêncio)", () => {
    expect(() => parseGupy({ data: [{ id: "x" }] })).toThrow();
  });

  it("type desconhecido → hint ausente (sem rótulo errado)", () => {
    const parsed = parseGupy({
      data: [
        {
          id: 1,
          name: "Vaga",
          careerPageName: "Acme",
          type: "vacancy_type_outro",
          jobUrl: "https://acme.gupy.io/job/1",
          city: "Recife",
          state: "Pernambuco",
        },
      ],
    });
    expect(parsed[0].employmentTypeHint ?? null).toBeNull();
  });
});
