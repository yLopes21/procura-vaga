import { describe, it, expect } from "vitest";
import { parseAdzuna } from "./adzuna";
import { rawJobSchema } from "./types";
import fixture from "./__fixtures__/adzuna-search.json";

describe("parseAdzuna (fixture baseada na doc da Adzuna)", () => {
  const jobs = parseAdzuna(fixture);

  it("extrai as 2 vagas de `results`", () => {
    expect(jobs).toHaveLength(2);
  });

  it("cada vaga satisfaz o contrato RawJobFromATS", () => {
    for (const j of jobs) expect(() => rawJobSchema.parse(j)).not.toThrow();
  });

  it("mapeia os campos crus (source, id, título, empresa aninhada, applyUrl, local)", () => {
    const first = jobs[0];
    expect(first.source).toBe("adzuna");
    expect(first.sourceJobId).toBe("4856789012");
    expect(first.title).toBe("Estágio em Administração");
    expect(first.company).toBe("Empresa Modelo Ltda");
    expect(first.applyUrl).toBe("https://www.adzuna.com.br/details/4856789012");
    expect(first.locationRaw).toBe("São Paulo, São Paulo");
  });

  it("fail loud: shape divergente lança (não retorna vazio em silêncio)", () => {
    expect(() => parseAdzuna({ results: [{ title: "X" }] })).toThrow(); // sem id/redirect_url
  });

  it("empresa vazia (display_name vazio) cai em fallback", () => {
    expect(jobs[1].company).toBe("Empresa não informada");
  });

  it("aceita id numérico convertendo para string", () => {
    const parsed = parseAdzuna({
      results: [
        {
          id: 12345,
          title: "Vaga",
          company: { display_name: "A" },
          location: { display_name: "Curitiba, Paraná" },
          redirect_url: "https://www.adzuna.com.br/details/12345",
        },
      ],
    });
    expect(parsed[0].sourceJobId).toBe("12345");
  });

  it("resiliência: pula item sem id/redirect_url e mantém os válidos", () => {
    const parsed = parseAdzuna({
      results: [
        {
          id: "1",
          title: "Boa",
          company: { display_name: "A" },
          location: { display_name: "São Paulo" },
          redirect_url: "https://x.com/1",
        },
        { title: "Sem id nem url" },
      ],
    });
    expect(parsed).toHaveLength(1);
    expect(parsed[0].sourceJobId).toBe("1");
  });
});
