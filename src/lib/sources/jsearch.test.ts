import { describe, it, expect } from "vitest";
import { parseJsearch } from "./jsearch";
import { rawJobSchema } from "./types";
import fixture from "./__fixtures__/jsearch-search.json";

describe("parseJsearch (fixture baseada na doc do JSearch/RapidAPI)", () => {
  const jobs = parseJsearch(fixture);

  it("extrai as 2 vagas de `data`", () => {
    expect(jobs).toHaveLength(2);
  });

  it("cada vaga satisfaz o contrato RawJobFromATS", () => {
    for (const j of jobs) expect(() => rawJobSchema.parse(j)).not.toThrow();
  });

  it("mapeia os campos crus (source, id, título, empresa, applyUrl)", () => {
    const first = jobs[0];
    expect(first.source).toBe("jsearch");
    expect(first.sourceJobId).toBe("abc123BR");
    expect(first.title).toBe("Estagiário Administrativo");
    expect(first.company).toBe("Empresa Exemplo Ltda");
    expect(first.applyUrl).toBe("https://www.linkedin.com/jobs/view/abc123");
  });

  it("monta locationRaw com cidade, estado e país (resolvível por location.ts)", () => {
    expect(jobs[0].locationRaw).toBe("São Paulo, São Paulo, BR");
  });

  it("traduz job_employment_type INTERN → estagio; demais → null", () => {
    expect(jobs[0].employmentTypeHint).toBe("estagio");
    expect(jobs[1].employmentTypeHint ?? null).toBeNull();
  });

  it("fail loud: shape divergente lança (não retorna vazio em silêncio)", () => {
    expect(() => parseJsearch({ data: [{ job_title: "X" }] })).toThrow(); // sem job_id/apply_link
  });

  it("empresa vazia cai em fallback (contrato exige company não-vazia)", () => {
    const parsed = parseJsearch({
      data: [{ job_id: "1", job_title: "Vaga", job_apply_link: "https://x.com/1", employer_name: "" }],
    });
    expect(parsed[0].company).toBe("Empresa não informada");
  });

  it("resiliência: pula vaga sem apply_link (a API pode mandar null) e mantém as válidas", () => {
    const parsed = parseJsearch({
      data: [
        { job_id: "1", job_title: "Boa", job_apply_link: "https://x.com/1", employer_name: "A" },
        { job_id: "2", job_title: "Sem link", job_apply_link: null, employer_name: "B" },
      ],
    });
    expect(parsed).toHaveLength(1);
    expect(parsed[0].sourceJobId).toBe("1");
  });
});
