import { describe, it, expect } from "vitest";
import { classifyJobStatus } from "./closeSignals";

const base = {
  httpStatus: 200,
  expectedUrl: "https://boards.greenhouse.io/acme/jobs/123",
  finalUrl: "https://boards.greenhouse.io/acme/jobs/123",
  bodyText: "Analista de Marketing Júnior — candidate-se já. Responsabilidades...",
};

describe("classifyJobStatus", () => {
  it("vaga normal aberta → open", () => {
    expect(classifyJobStatus(base).status).toBe("open");
  });

  it("HTTP 404 → closed", () => {
    expect(classifyJobStatus({ ...base, httpStatus: 404 }).status).toBe("closed");
  });

  it("HTTP 410 → closed", () => {
    expect(classifyJobStatus({ ...base, httpStatus: 410 }).status).toBe("closed");
  });

  it("rede caída (status 0) → unknown", () => {
    expect(classifyJobStatus({ ...base, httpStatus: 0 }).status).toBe("unknown");
  });

  it("erro de servidor 503 → unknown (não assume fechada)", () => {
    expect(classifyJobStatus({ ...base, httpStatus: 503 }).status).toBe("unknown");
  });

  it("marcador PT 'vaga encerrada' → closed", () => {
    expect(
      classifyJobStatus({ ...base, bodyText: "Esta vaga foi ENCERRADA. Veja outras." }).status,
    ).toBe("closed");
  });

  it("marcador PT 'não está mais disponível' → closed", () => {
    expect(
      classifyJobStatus({ ...base, bodyText: "A vaga não está mais disponível no momento." })
        .status,
    ).toBe("closed");
  });

  it("marcador EN 'no longer accepting applications' → closed", () => {
    expect(
      classifyJobStatus({
        ...base,
        bodyText: "We are no longer accepting applications for this role.",
      }).status,
    ).toBe("closed");
  });

  it("marcador EN 'position has been filled' → closed", () => {
    expect(
      classifyJobStatus({ ...base, bodyText: "This position has been filled. Thank you." })
        .status,
    ).toBe("closed");
  });

  it("redirect para home (path '/') → closed", () => {
    expect(
      classifyJobStatus({
        ...base,
        finalUrl: "https://boards.greenhouse.io/",
        bodyText: "Bem-vindo às nossas vagas",
      }).status,
    ).toBe("closed");
  });

  it("redirect para listagem genérica (/jobs) → closed", () => {
    expect(
      classifyJobStatus({
        ...base,
        finalUrl: "https://boards.greenhouse.io/acme",
        expectedUrl: "https://boards.greenhouse.io/acme/jobs/123",
        bodyText: "Todas as vagas",
      }).status,
    ).toBe("closed");
  });

  it("redirect para 'similar jobs' → closed", () => {
    expect(
      classifyJobStatus({
        ...base,
        finalUrl: "https://site.com/jobs/similar?ref=expired",
        bodyText: "Vagas similares para você",
      }).status,
    ).toBe("closed");
  });

  it("mesma URL, conteúdo válido → open", () => {
    expect(
      classifyJobStatus({
        ...base,
        finalUrl: "https://boards.greenhouse.io/acme/jobs/123?utm=x",
        bodyText: "Descrição completa da vaga e requisitos.",
      }).status,
    ).toBe("open");
  });
});
