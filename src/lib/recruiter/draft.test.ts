import { describe, it, expect } from "vitest";
import { buildRecruiterDraft } from "./draft";

describe("buildRecruiterDraft", () => {
  it("personaliza a mensagem com título e empresa", () => {
    const d = buildRecruiterDraft({ title: "Estágio em Administração", company: "Nubank" });
    expect(d.message).toContain("Estágio em Administração");
    expect(d.message).toContain("Nubank");
  });

  it("assunto menciona a vaga", () => {
    const d = buildRecruiterDraft({ title: "Estágio em Administração", company: "Nubank" });
    expect(d.subject).toContain("Estágio em Administração");
  });

  it("linkedinSearchUrl busca pessoas da empresa, com o termo encodado", () => {
    const d = buildRecruiterDraft({ title: "X", company: "Acme & Co" });
    expect(d.linkedinSearchUrl).toContain("linkedin.com/search/results/people");
    expect(d.linkedinSearchUrl).toContain(encodeURIComponent("Acme & Co"));
    expect(d.linkedinSearchUrl).not.toContain("Acme & Co"); // não pode ir cru (quebra a URL)
  });

  it("usa fallback quando título/empresa vêm vazios (não gera texto quebrado)", () => {
    const d = buildRecruiterDraft({ title: "", company: "" });
    expect(d.message.trim().length).toBeGreaterThan(0);
    expect(d.subject.trim().length).toBeGreaterThan(0);
    expect(d.linkedinSearchUrl).toContain("linkedin.com");
  });

  it("inclui um espaço para o candidato se apresentar (placeholder editável)", () => {
    const d = buildRecruiterDraft({ title: "X", company: "Y" });
    expect(d.message).toMatch(/\[.+\]/); // marcador [ ... ] para o Rodrigo preencher
  });
});
