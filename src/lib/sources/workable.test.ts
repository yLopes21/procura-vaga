import { describe, it, expect } from "vitest";
import { parseWorkable } from "./workable";
import { rawJobSchema } from "./types";
import fixture from "./__fixtures__/workable-workable.json";

describe("parseWorkable (fixture real do board 'careers' da Workable)", () => {
  const jobs = parseWorkable(fixture, "careers");

  it("extrai as 3 vagas da fixture (results, nao total)", () => {
    expect(jobs).toHaveLength(3);
  });

  it("cada vaga satisfaz o contrato RawJobFromATS", () => {
    for (const j of jobs) expect(() => rawJobSchema.parse(j)).not.toThrow();
  });

  it("mapeia os campos crus corretamente", () => {
    const first = jobs[0];
    expect(first.source).toBe("workable");
    // sourceJobId usa o shortcode (estavel para deep-link), com fallback para id.
    expect(first.sourceJobId).toBe("39441A01CA");
    expect(first.applyUrl).toBe(
      "https://apply.workable.com/careers/j/39441A01CA/",
    );
    expect(first.title).toBe("Enterprise Account Executive (New Business)");
    // location montada a partir de city/region/country (region nulo é omitido).
    expect(first.locationRaw).toBe("London, United Kingdom");
    expect(first.updatedAt).toBe("2026-05-12T00:00:00.000Z");
    // sem nome de empresa por vaga no v3 -> usa o board como fallback.
    expect(first.company).toBe("careers");
  });

  it("monta locationRaw incluindo region quando presente", () => {
    const second = jobs[1]; // Boston, Massachusetts, United States
    expect(second.locationRaw).toBe("Boston, Massachusetts, United States");
  });

  it("fail loud: shape divergente lança (não retorna vazio em silêncio)", () => {
    // results ausente -> shape invalido deve lançar, nao devolver [].
    expect(() => parseWorkable({ total: 0 }, "x")).toThrow();
    // id/shortcode ausentes em um job -> tambem deve lançar.
    expect(() =>
      parseWorkable({ results: [{ title: "Dev" }] }, "x"),
    ).toThrow();
  });

  it("usa String(id) como sourceJobId quando shortcode falta", () => {
    const parsed = parseWorkable(
      {
        results: [
          {
            id: 42,
            title: "Dev",
            location: { country: "Brazil", countryCode: "BR", city: "Rio", region: null },
            published: null,
          },
        ],
      },
      "acme",
    );
    expect(parsed[0].sourceJobId).toBe("42");
    expect(parsed[0].applyUrl).toBe("https://apply.workable.com/acme/j/42/");
    expect(parsed[0].locationRaw).toBe("Rio, Brazil");
    expect(parsed[0].updatedAt).toBeNull();
  });

  it("locationRaw é null quando location é nula/ausente", () => {
    const parsed = parseWorkable(
      { results: [{ id: 7, shortcode: "AB", title: "Dev", location: null, published: null }] },
      "acme",
    );
    expect(parsed[0].locationRaw).toBeNull();
  });
});
