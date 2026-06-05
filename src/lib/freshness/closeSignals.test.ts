import { describe, it, expect } from "vitest";
import { classifyJobStatus, toDbStatus } from "./closeSignals";

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

  it("mesma URL, COM CTA de candidatura → open", () => {
    expect(
      classifyJobStatus({
        ...base,
        finalUrl: "https://boards.greenhouse.io/acme/jobs/123?utm=x",
        bodyText: "Descrição completa da vaga. Candidate-se já!",
      }).status,
    ).toBe("open");
  });

  // PM-01 (régua agressiva): 200 sem marcador de fechamento E sem CTA → unknown,
  // nunca 'open'. Exige sinal POSITIVO de vaga aberta.
  it("conteúdo de vaga SEM CTA → unknown (não assume aberta)", () => {
    expect(
      classifyJobStatus({ ...base, bodyText: "Descrição completa da vaga e requisitos." }).status,
    ).toBe("unknown");
  });

  it("CTA 'inscreva-se' → open", () => {
    expect(
      classifyJobStatus({ ...base, bodyText: "Inscreva-se para esta oportunidade." }).status,
    ).toBe("open");
  });

  it("CTA em inglês 'apply now' → open", () => {
    expect(classifyJobStatus({ ...base, bodyText: "Apply now to join our team." }).status).toBe(
      "open",
    );
  });

  it("shell de SPA vazio (sem CTA) → unknown", () => {
    expect(classifyJobStatus({ ...base, bodyText: '<div id="root"></div>' }).status).toBe(
      "unknown",
    );
  });

  it("marcador novo 'oportunidade finalizada' → closed", () => {
    expect(
      classifyJobStatus({ ...base, bodyText: "Esta oportunidade foi finalizada. Candidate-se a outras." })
        .status,
    ).toBe("closed");
  });

  it("marcador novo EN 'no longer posted' → closed", () => {
    expect(
      classifyJobStatus({ ...base, bodyText: "This job is no longer posted. Apply to similar roles." })
        .status,
    ).toBe("closed");
  });
});

// VF-04: o detector fala "open"; a coluna jobs.status fala "active".
describe("toDbStatus (vocabulário detector → banco)", () => {
  it.each([
    ["open", "active"],
    ["closed", "closed"],
    ["unknown", "unknown"],
  ] as const)("'%s' → '%s'", (input, expected) => {
    expect(toDbStatus(input)).toBe(expected);
  });
});
