import { describe, it, expect } from "vitest";
import { parseGreenhouse } from "./greenhouse";
import { rawJobSchema } from "./types";
import fixture from "./__fixtures__/greenhouse-nubank.json";

describe("parseGreenhouse (fixture real da nubank)", () => {
  const jobs = parseGreenhouse(fixture, "nubank");

  it("extrai as 3 vagas da fixture", () => {
    expect(jobs).toHaveLength(3);
  });

  it("cada vaga satisfaz o contrato RawJobFromATS", () => {
    for (const j of jobs) expect(() => rawJobSchema.parse(j)).not.toThrow();
  });

  it("mapeia os campos crus corretamente", () => {
    const first = jobs[0];
    expect(first.source).toBe("greenhouse");
    expect(first.sourceJobId).toBe("7977320");
    expect(first.applyUrl).toMatch(/^https:\/\/job-boards\.greenhouse\.io\/nubank\/jobs\/7977320$/);
    expect(first.company).toBe("Nubank");
    expect(first.title).toContain("AI and Agentic AI Risk Management");
    expect(first.locationRaw).toBeTypeOf("string");
  });

  it("fail loud: shape divergente lança (não retorna vazio em silêncio)", () => {
    expect(() => parseGreenhouse({ jobs: [{ id: "não-numérico" }] }, "x")).toThrow();
  });

  it("usa o nome do board como fallback quando company_name falta", () => {
    const parsed = parseGreenhouse(
      { jobs: [{ id: 1, title: "Dev", absolute_url: "https://x.io/a/jobs/1" }] },
      "acme",
    );
    expect(parsed[0].company).toBe("acme");
  });
});
