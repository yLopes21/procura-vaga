import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseVagas, buildVagasSearchUrl } from "./vagas";
import { rawJobSchema } from "./types";

/** li.vaga mínimo válido para testar comportamento sem depender da fixture grande. */
const cardVaga = (opts: { id?: string; title?: string; href?: string; nivel?: string }) =>
  `<li class="vaga"><a class="link-detalhes-vaga" data-id-vaga="${opts.id ?? "1"}"${
    opts.title === undefined ? "" : ` title="${opts.title}"`
  }${opts.href === undefined ? "" : ` href="${opts.href}"`}></a><span class="emprVaga">ACME</span><span class="nivelVaga">${opts.nivel ?? "Estágio"}</span></li>`;

const html = readFileSync(new URL("./__fixtures__/vagas-estagio.html", import.meta.url), "utf-8");

describe("parseVagas (fixture real do Vagas.com)", () => {
  const jobs = parseVagas(html);

  it("extrai os 3 cards da fixture", () => {
    expect(jobs).toHaveLength(3);
  });

  it("cada vaga satisfaz o contrato RawJobFromATS", () => {
    for (const j of jobs) expect(() => rawJobSchema.parse(j)).not.toThrow();
  });

  it("mapeia os campos crus (source, id, título limpo, empresa, applyUrl absoluta)", () => {
    const first = jobs[0];
    expect(first.source).toBe("vagas");
    expect(first.sourceJobId).toBe("2813045");
    expect(first.title).toBe("Estagiário(a) - Administrativo");
    expect(first.company).toBe("CIEE");
    expect(first.applyUrl).toBe(
      "https://www.vagas.com.br/vagas/v2813045/estagiario-a-administrativo",
    );
  });

  it("traduz o nível 'Estágio' para employmentTypeHint", () => {
    expect(jobs[0].employmentTypeHint).toBe("estagio");
  });

  it("locationRaw é null quando o card não expõe o local (resolvido depois)", () => {
    expect(jobs[0].locationRaw).toBeNull();
  });

  it("fail loud: card sem título/link lança (estrutura mudada não passa em silêncio)", () => {
    expect(() =>
      parseVagas('<ul><li class="vaga"><a class="link-detalhes-vaga" data-id-vaga="1"></a></li></ul>'),
    ).toThrow();
  });

  it("busca vazia (0 cards) retorna [] sem lançar", () => {
    expect(parseVagas('<ul class="lista-vagas"></ul>')).toEqual([]);
  });
});

describe("parseVagas — resiliência e mapeamento de nível", () => {
  it("pula card inválido individual mas mantém os válidos (scraping resiliente)", () => {
    const html = `<ul>${cardVaga({ id: "1", title: "Estágio A", href: "/vagas/v1/a" })}${cardVaga({ id: "2", title: "Sem href" })}</ul>`;
    const jobs = parseVagas(html);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].sourceJobId).toBe("1");
  });

  it("lança se a página tinha cards mas NENHUM virou vaga (estrutura mudou de vez)", () => {
    const html = `<ul>${cardVaga({ id: "1" })}${cardVaga({ id: "2" })}</ul>`;
    expect(() => parseVagas(html)).toThrow();
  });

  it("mapeia o nível para o vínculo (aprendiz e trainee → trainee, profissional → null)", () => {
    const hint = (nivel: string) =>
      parseVagas(`<ul>${cardVaga({ title: "X", href: "/vagas/v1/x", nivel })}</ul>`)[0].employmentTypeHint;
    expect(hint("Estágio")).toBe("estagio");
    expect(hint("Jovem Aprendiz")).toBe("trainee");
    expect(hint("Trainee")).toBe("trainee");
    expect(hint("Efetivo")).toBeNull();
  });
});

describe("buildVagasSearchUrl", () => {
  it("monta a URL de busca com + entre termos", () => {
    expect(buildVagasSearchUrl("estagio administracao")).toBe(
      "https://www.vagas.com.br/vagas-de-estagio+administracao",
    );
  });

  it("encoda acentos para não quebrar a URL com termos PT-BR", () => {
    expect(buildVagasSearchUrl("estágio")).toBe("https://www.vagas.com.br/vagas-de-est%C3%A1gio");
  });
});
