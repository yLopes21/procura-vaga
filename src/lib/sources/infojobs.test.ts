import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseInfojobs, buildInfojobsSearchUrl } from "./infojobs";
import { rawJobSchema } from "./types";

/** div.js_rowCard mínimo para testar comportamento sem a fixture grande. */
const cardIJ = (opts: { id?: string; title?: string; href?: string; withTitle?: boolean }) =>
  `<div class="js_rowCard" data-href="${opts.href ?? `/vaga__${opts.id ?? "1"}.aspx`}" data-id="${opts.id ?? "1"}"><a href="/empresa-x__1.aspx">ACME</a>${
    opts.withTitle === false ? "" : `<h2 class="js_vacancyTitle">${opts.title ?? "Estágio X"}</h2>`
  }</div>`;

const html = readFileSync(new URL("./__fixtures__/infojobs-estagio.html", import.meta.url), "utf-8");

describe("parseInfojobs (fixture real do InfoJobs)", () => {
  const jobs = parseInfojobs(html);

  it("extrai os 3 cards da fixture", () => {
    expect(jobs).toHaveLength(3);
  });

  it("cada vaga satisfaz o contrato RawJobFromATS", () => {
    for (const j of jobs) expect(() => rawJobSchema.parse(j)).not.toThrow();
  });

  it("mapeia os campos crus (source, id, título, empresa, applyUrl absoluta, local Cidade-UF)", () => {
    const first = jobs[0];
    expect(first.source).toBe("infojobs");
    expect(first.sourceJobId).toBe("11689088");
    expect(first.title).toBe("Estágio - Administração De Pessoal");
    expect(first.company).toBe("PATRUS TRANSPORTES");
    expect(first.applyUrl).toBe(
      "https://www.infojobs.com.br/vaga-de-estagio-administracao-pessoal-em-minas-gerais__11689088.aspx",
    );
    expect(first.locationRaw).toBe("Contagem - MG");
  });

  it("converte o data-value do card para updatedAt em ISO (sem depender de timezone)", () => {
    expect(jobs[0].updatedAt).toBe("2026-06-05T10:51:00");
  });

  it("vaga confidencial (sem link de empresa) cai em fallback, nunca empresa vazia", () => {
    expect(jobs[2].company).toBe("Empresa confidencial");
  });

  it("fail loud: card sem título lança (estrutura mudada não passa em silêncio)", () => {
    expect(() =>
      parseInfojobs('<div class="js_rowCard" data-href="/x__1.aspx" data-id="1"></div>'),
    ).toThrow();
  });

  it("busca vazia (0 cards) retorna [] sem lançar", () => {
    expect(parseInfojobs("<div></div>")).toEqual([]);
  });
});

describe("parseInfojobs — resiliência e URL", () => {
  it("pula card inválido individual mas mantém os válidos (scraping resiliente)", () => {
    const html = `<div>${cardIJ({ id: "1", title: "Estágio A" })}${cardIJ({ id: "", title: "Sem id" })}</div>`;
    const jobs = parseInfojobs(html);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].sourceJobId).toBe("1");
  });

  it("lança se a página tinha cards mas NENHUM virou vaga (estrutura mudou de vez)", () => {
    const html = `<div>${cardIJ({ id: "1", withTitle: false })}${cardIJ({ id: "2", withTitle: false })}</div>`;
    expect(() => parseInfojobs(html)).toThrow();
  });
});

describe("buildInfojobsSearchUrl", () => {
  it("monta a URL com o parâmetro palabra encodado", () => {
    expect(buildInfojobsSearchUrl("estagio administracao")).toBe(
      "https://www.infojobs.com.br/empregos.aspx?palabra=estagio+administracao",
    );
  });
});
