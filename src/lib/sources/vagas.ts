import * as cheerio from "cheerio";
import { rawJobSchema, type RawJobFromATS } from "./types";
import { fetchHtmlWithRetry } from "./http";

/**
 * Scraper do Vagas.com (HTML público da busca, sem login).
 * Como o Gupy, é um PORTAL DE BUSCA: a ingestão chama por TERMO
 * (ex.: "estagio administracao"), não por empresa.
 *   GET https://www.vagas.com.br/vagas-de-<termo-com-+>
 * O card da listagem NÃO traz o local (carregado via JS), então locationRaw fica
 * null e a UF é resolvida pelo que houver depois. Uso pessoal; nunca raspar área logada.
 */
const SOURCE = "vagas";
const BASE = "https://www.vagas.com.br";

const clean = (s: string): string => s.replace(/\s+/g, " ").trim();

/** Traduz o rótulo de nível do Vagas.com para a dica de vínculo do contrato. */
function hintFromNivel(nivel: string): RawJobFromATS["employmentTypeHint"] {
  const n = nivel.toLowerCase();
  if (n.includes("estági") || n.includes("estagi")) return "estagio";
  // Alinhado ao Gupy (young_apprentice → trainee): mantém o vínculo consistente
  // entre fontes para a mesma vaga.
  if (n.includes("trainee") || n.includes("aprendiz")) return "trainee";
  return null; // níveis profissionais → a ingestão classifica pelo título
}

/** Monta a URL de busca do Vagas.com encodando o termo (não quebra com acentos). */
export function buildVagasSearchUrl(query: string): string {
  const slug = encodeURIComponent(query.trim()).replace(/%20/g, "+");
  return `${BASE}/vagas-de-${slug}`;
}

/**
 * Converte a página de busca do Vagas.com em RawJobFromATS[]. Parser puro (sem
 * rede), testável por fixture. Resiliente a card anômalo: cada card é validado
 * pelo rawJobSchema e um card inválido é descartado — MAS se a página tinha cards
 * e NENHUM virou vaga, lança (estrutura mudou; não devolve [] em silêncio, PM-08).
 * Busca legítima sem resultado (0 cards) retorna [].
 */
export function parseVagas(html: string): RawJobFromATS[] {
  const $ = cheerio.load(html);
  const cards = $("li.vaga");
  const out: RawJobFromATS[] = [];
  cards.each((_, el) => {
    const card = $(el);
    const a = card.find("a.link-detalhes-vaga").first();
    const href = a.attr("href")?.trim();
    try {
      out.push(
        rawJobSchema.parse({
          source: SOURCE,
          sourceJobId: a.attr("data-id-vaga")?.trim() ?? "",
          applyUrl: href ? new URL(href, BASE).href : "",
          company: clean(card.find("span.emprVaga").text()) || "Empresa não informada",
          title: clean(a.attr("title") ?? a.text()),
          locationRaw: null,
          updatedAt: null,
          employmentTypeHint: hintFromNivel(clean(card.find("span.nivelVaga").text())),
        }),
      );
    } catch {
      // card individual fora do shape: descarta; a falha global é detectada abaixo
    }
  });
  if (cards.length > 0 && out.length === 0) {
    throw new Error(`vagas: ${cards.length} cards na página e 0 válidos — seletores podem ter mudado`);
  }
  return out;
}

/** Busca vagas no Vagas.com por termo (com retry). Lança se esgotar (fail loud, PM-08). */
export async function fetchVagasJobs(query: string): Promise<RawJobFromATS[]> {
  const html = await fetchHtmlWithRetry(buildVagasSearchUrl(query), `vagas "${query}"`);
  return parseVagas(html);
}
