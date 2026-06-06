import { describe, it, expect } from "vitest";
import { parseJooble } from "./jooble";
import { rawJobSchema } from "./types";
import fixture from "./__fixtures__/jooble-portal.json";

describe("parseJooble (fixture real do Jooble)", () => {
  const jobs = parseJooble(fixture);

  it("extrai as 2 vagas de `jobs`", () => {
    expect(jobs).toHaveLength(2);
  });

  it("cada vaga satisfaz o contrato RawJobFromATS", () => {
    for (const j of jobs) expect(() => rawJobSchema.parse(j)).not.toThrow();
  });

  it("sourceJobId vem do LINK (id numérico estoura MAX_SAFE_INTEGER e vem truncado)", () => {
    // id no JSON: 8474638911512377000 (truncado); no link: ...377474 (íntegro)
    expect(jobs[0].sourceJobId).toBe("8474638911512377474");
    expect(jobs[1].sourceJobId).toBe("2876450956523887147");
  });

  it("mapeia os campos crus (source, applyUrl=link, empresa, título, local)", () => {
    const first = jobs[0];
    expect(first.source).toBe("jooble");
    expect(first.applyUrl).toBe("https://jooble.org/jdp/8474638911512377474");
    expect(first.company).toBe("EDPR");
    expect(first.title).toContain("EDP Estagios");
    expect(first.locationRaw).toBe("Houston, TX");
  });

  it("fail loud: shape divergente lança (não retorna vazio em silêncio)", () => {
    expect(() => parseJooble({ jobs: [{ title: "X" }] })).toThrow(); // sem link
  });

  it("type do Jooble vira employmentTypeHint (estágio/trainee), vazio → null", () => {
    const parsed = parseJooble({
      jobs: [
        { title: "Vaga", link: "https://jooble.org/jdp/1", company: "A", type: "Estágio" },
        { title: "Vaga", link: "https://jooble.org/jdp/2", company: "A", type: "" },
      ],
    });
    expect(parsed[0].employmentTypeHint).toBe("estagio");
    expect(parsed[1].employmentTypeHint ?? null).toBeNull();
  });

  it("empresa vazia cai em fallback (contrato exige company não-vazia)", () => {
    const parsed = parseJooble({ jobs: [{ title: "Vaga", link: "https://jooble.org/jdp/9", company: "" }] });
    expect(parsed[0].company).toBe("Empresa não informada");
  });

  it("resiliência: pula item inválido (sem link) e mantém os válidos", () => {
    const parsed = parseJooble({
      jobs: [
        { title: "Boa", link: "https://jooble.org/jdp/5", company: "A" },
        { title: "Sem link", company: "B" },
      ],
    });
    expect(parsed).toHaveLength(1);
    expect(parsed[0].sourceJobId).toBe("5");
  });

  it("normaliza acento no type: 'Estágio' e 'Estagio' → estagio", () => {
    const hint = (type: string) =>
      parseJooble({ jobs: [{ title: "V", link: "https://jooble.org/jdp/1", company: "A", type }] })[0]
        .employmentTypeHint;
    expect(hint("Estágio")).toBe("estagio");
    expect(hint("Estagio")).toBe("estagio");
  });
});
