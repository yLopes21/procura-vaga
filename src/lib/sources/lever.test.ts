import { describe, it, expect } from "vitest";
import { parseLever } from "./lever";
import { rawJobSchema } from "./types";
import fixture from "./__fixtures__/lever-spotify.json";

describe("parseLever (fixture real do spotify)", () => {
  const jobs = parseLever(fixture, "spotify");

  it("extrai as 3 vagas da fixture", () => {
    expect(jobs).toHaveLength(3);
  });

  it("cada vaga satisfaz o contrato RawJobFromATS", () => {
    for (const j of jobs) expect(() => rawJobSchema.parse(j)).not.toThrow();
  });

  it("mapeia os campos crus corretamente", () => {
    const first = jobs[0];
    expect(first.source).toBe("lever");
    expect(first.sourceJobId).toBe("88499546-e9f7-4403-87a5-240050bd7c5b");
    expect(first.applyUrl).toBe(
      "https://jobs.lever.co/spotify/88499546-e9f7-4403-87a5-240050bd7c5b/apply",
    );
    expect(first.company).toBe("spotify");
    expect(first.title).toBe("Accounts Payable Analyst");
    expect(first.locationRaw).toBe("New York, NY");
  });

  it("converte createdAt (ms epoch) para ISO em updatedAt", () => {
    // 1778529611285 -> 2026-05-11T20:00:11.285Z
    expect(jobs[0].updatedAt).toBe("2026-05-11T20:00:11.285Z");
  });

  it("fail loud: shape divergente lança (não retorna vazio em silêncio)", () => {
    // resposta não-array (Lever sempre devolve array no topo)
    expect(() => parseLever({ jobs: [] }, "x")).toThrow();
    // createdAt em tipo errado (string em vez de number)
    expect(() =>
      parseLever([{ id: "1", text: "Dev", hostedUrl: "https://x.io/1", createdAt: "ontem" }], "x"),
    ).toThrow();
  });

  it("usa hostedUrl como fallback quando applyUrl falta, e board como company", () => {
    const parsed = parseLever(
      [{ id: "9", text: "Eng", hostedUrl: "https://jobs.lever.co/acme/9", createdAt: 0 }],
      "acme",
    );
    expect(parsed[0].applyUrl).toBe("https://jobs.lever.co/acme/9");
    expect(parsed[0].company).toBe("acme");
    expect(parsed[0].locationRaw).toBeNull();
    expect(parsed[0].updatedAt).toBe("1970-01-01T00:00:00.000Z");
  });
});
