import { describe, it, expect } from "vitest";
import { parseAshby } from "./ashby";
import { rawJobSchema } from "./types";
import fixture from "./__fixtures__/ashby-ramp.json";

describe("parseAshby (fixture real da Ramp)", () => {
  const jobs = parseAshby(fixture, "Ramp");

  it("extrai as 3 vagas da fixture", () => {
    expect(jobs).toHaveLength(3);
  });

  it("cada vaga satisfaz o contrato RawJobFromATS", () => {
    for (const j of jobs) expect(() => rawJobSchema.parse(j)).not.toThrow();
  });

  it("mapeia os campos crus corretamente", () => {
    const first = jobs[0];
    expect(first.source).toBe("ashby");
    expect(first.sourceJobId).toBe("34413f8d-26bf-4bbc-8ade-eb309a0e2245");
    expect(first.applyUrl).toBe(
      "https://jobs.ashbyhq.com/Ramp/34413f8d-26bf-4bbc-8ade-eb309a0e2245/application",
    );
    expect(first.company).toBe("Ramp");
    expect(first.title).toContain("Security Engineer, Cloud");
    expect(first.locationRaw).toBe("New York, NY (HQ)");
    expect(first.updatedAt).toBe("2026-04-07T17:12:35.753+00:00");
  });

  it("fail loud: shape divergente lança (não retorna vazio em silêncio)", () => {
    expect(() => parseAshby({ jobs: [{ id: 123 }] }, "x")).toThrow();
  });

  it("usa jobUrl como applyUrl quando applyUrl falta", () => {
    const parsed = parseAshby(
      {
        jobs: [
          {
            id: "abc",
            title: "Dev",
            jobUrl: "https://jobs.ashbyhq.com/acme/abc",
          },
        ],
      },
      "acme",
    );
    expect(parsed[0].applyUrl).toBe("https://jobs.ashbyhq.com/acme/abc");
  });
});
