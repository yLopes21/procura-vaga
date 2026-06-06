import { describe, it, expect } from "vitest";
import { buildDigest, type DigestJob } from "./digest";

const job = (over: Partial<DigestJob> = {}): DigestJob => ({
  title: "Estágio em Administração",
  company: "ACME",
  applyUrl: "https://example.com/vaga/1",
  locationUf: "SP",
  locationCity: "São Paulo",
  remoteFlag: false,
  employmentType: "estagio",
  ...over,
});

describe("buildDigest", () => {
  it("0 vagas → null (não envia e-mail vazio)", () => {
    expect(buildDigest([])).toBeNull();
  });

  it("monta o assunto com a contagem de vagas", () => {
    const d = buildDigest([job(), job({ applyUrl: "https://example.com/vaga/2" })]);
    expect(d?.subject).toContain("2");
  });

  it("lista título, empresa e link de cada vaga no HTML", () => {
    const d = buildDigest([job({ title: "Estágio Adm", company: "Nubank", applyUrl: "https://nubank.com/v/1" })]);
    expect(d?.html).toContain("Estágio Adm");
    expect(d?.html).toContain("Nubank");
    expect(d?.html).toContain("https://nubank.com/v/1");
  });

  it("escapa HTML dos campos dinâmicos (anti-injeção no e-mail)", () => {
    const d = buildDigest([job({ title: "<script>alert(1)</script>", company: "A & B" })]);
    expect(d?.html).not.toContain("<script>alert(1)</script>");
    expect(d?.html).toContain("&lt;script&gt;");
    expect(d?.html).toContain("A &amp; B");
  });

  it("mostra 'Remoto' quando remoteFlag e a localização quando presencial", () => {
    expect(buildDigest([job({ remoteFlag: true })])?.html).toContain("Remoto");
    expect(buildDigest([job({ remoteFlag: false, locationCity: "Recife", locationUf: "PE" })])?.html).toContain(
      "Recife",
    );
  });

  it("bloqueia URL não-http (javascript:) no link — troca por # (anti-XSS no e-mail)", () => {
    const d = buildDigest([job({ applyUrl: "javascript:alert(1)" })]);
    expect(d?.html).not.toContain("javascript:");
    expect(d?.html).toContain('href="#"');
  });

  it("limita a 50 vagas e indica o excedente", () => {
    const many = Array.from({ length: 60 }, (_, i) => job({ applyUrl: `https://example.com/v/${i}` }));
    const d = buildDigest(many);
    const cardCount = (d?.html.match(/class="vaga-card"/g) ?? []).length;
    expect(cardCount).toBe(50);
    expect(d?.html).toContain("mais 10");
  });
});
