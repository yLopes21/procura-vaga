import * as cheerio from "cheerio";
import { rawJobSchema, type RawJobFromATS } from "./types";
import { fetchHtmlWithRetry } from "./http";

/**
 * Scraper do InfoJobs BR (HTML público da busca, sem login).
 * Portal de busca por TERMO via query `palabra` (o site é de origem espanhola):
 *   GET https://www.infojobs.com.br/empregos.aspx?palabra=<termo>
 * Diferente do Vagas.com, o card já traz cidade/UF e a data de publicação.
 */
const SOURCE = "infojobs";
const BASE = "https://www.infojobs.com.br";

const clean = (s: string): string => s.replace(/\s+/g, " ").trim();

/** "2026/06/05 10:51:00" → "2026-06-05T10:51:00" (ISO sem TZ; null se não casar). */
function toIso(dataValue: string | undefined): string | null {
  const m = dataValue?.trim().match(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` : null;
}

/** Monta a URL de busca do InfoJobs (searchParams encoda o termo corretamente). */
export function buildInfojobsSearchUrl(query: string): string {
  const url = new URL("/empregos.aspx", BASE);
  url.searchParams.set("palabra", query.trim());
  return url.href;
}

/**
 * Converte a página de busca do InfoJobs em RawJobFromATS[]. Parser puro (sem rede).
 * O local é achado pelo padrão "Cidade - UF" entre os nós-folha de texto do card —
 * ancorado no conteúdo, não em utility class volátil. Resiliente a card anômalo
 * (descarta inválido) mas lança se a página tinha cards e nenhum virou vaga (PM-08).
 */
export function parseInfojobs(html: string): RawJobFromATS[] {
  const $ = cheerio.load(html);
  const cards = $("div.js_rowCard[data-href]");
  const out: RawJobFromATS[] = [];
  cards.each((_, el) => {
    const card = $(el);
    const href = card.attr("data-href")?.trim();

    let locationRaw: string | null = null;
    card.find("div, span").each((_i, node) => {
      const own = clean($(node).clone().children().remove().end().text());
      if (/^[A-Za-zÀ-ú.\s]+ - [A-Z]{2}$/.test(own)) {
        locationRaw = own;
        return false; // primeiro "Cidade - UF" basta
      }
    });

    try {
      out.push(
        rawJobSchema.parse({
          source: SOURCE,
          sourceJobId: card.attr("data-id")?.trim() ?? "",
          applyUrl: href ? new URL(href, BASE).href : "",
          company: clean(card.find('a[href*="/empresa-"]').first().text()) || "Empresa confidencial",
          title: clean(card.find(".js_vacancyTitle").first().text()),
          locationRaw,
          updatedAt: toIso(card.find(".js_date").first().attr("data-value")),
          employmentTypeHint: null, // InfoJobs não expõe vínculo explícito → ingestão classifica
        }),
      );
    } catch {
      // card individual fora do shape: descarta; a falha global é detectada abaixo
    }
  });
  if (cards.length > 0 && out.length === 0) {
    throw new Error(`infojobs: ${cards.length} cards na página e 0 válidos — seletores podem ter mudado`);
  }
  return out;
}

/** Busca vagas no InfoJobs por termo (com retry). Lança se esgotar (fail loud, PM-08). */
export async function fetchInfojobsJobs(query: string): Promise<RawJobFromATS[]> {
  const html = await fetchHtmlWithRetry(buildInfojobsSearchUrl(query), `infojobs "${query}"`);
  return parseInfojobs(html);
}
