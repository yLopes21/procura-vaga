import { describe, it, expect } from "vitest";
import { toNewJob } from "./toNewJob";
import type { RawJobFromATS } from "@/lib/sources/types";

const base: RawJobFromATS = {
  source: "gupy",
  sourceJobId: "123",
  applyUrl: "https://acme.gupy.io/job/123",
  company: "Acme",
  title: "Estágio em Administração",
  locationRaw: "São Paulo, São Paulo",
  updatedAt: null,
  employmentTypeHint: "estagio",
};

describe("toNewJob (enriquecimento RawJobFromATS → linha do catálogo)", () => {
  it("usa o hint da fonte quando presente e marca confidence high", () => {
    const j = toNewJob(base);
    expect(j.employmentType).toBe("estagio");
    expect(j.confidence).toBe("high");
  });

  it("normaliza UF/cidade a partir do locationRaw", () => {
    const j = toNewJob(base);
    expect(j.locationUf).toBe("SP");
    expect(j.locationCity).toBe("São Paulo");
  });

  it("titleNorm é minúsculo sem acento; title preserva acento", () => {
    const j = toNewJob(base);
    expect(j.title).toBe("Estágio em Administração");
    expect(j.titleNorm).toBe("estagio em administracao");
  });

  it("sem hint, classifica pelo título (Estágio → estagio)", () => {
    const j = toNewJob({ ...base, employmentTypeHint: null, title: "Estágio em RH" });
    expect(j.employmentType).toBe("estagio");
  });

  it("título ambíguo sem hint → unknown e confidence low", () => {
    const j = toNewJob({ ...base, employmentTypeHint: null, title: "Programa de Talentos 2026", locationRaw: "Brasil" });
    expect(j.employmentType).toBe("unknown");
    expect(j.confidence).toBe("low");
    expect(j.locationUf).toBeNull();
  });

  it("gera dedupClusterId estável", () => {
    expect(toNewJob(base).dedupClusterId).toBe(toNewJob({ ...base, sourceJobId: "999" }).dedupClusterId);
  });
});
