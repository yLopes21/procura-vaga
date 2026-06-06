/**
 * Orquestração da coleta por TERMO, extraída do entrypoint para ser testável.
 * Concentra o kill-switch por fonte e a dedup — a lógica de risco da ingestão.
 */
import type { RawJobFromATS } from "./types";

export type QuerySource = (query: string) => Promise<RawJobFromATS[]>;

export interface CollectAcc {
  raws: RawJobFromATS[];
  errors: string[];
  perSource: Record<string, number>;
}

const SCRAPE_DELAY_MS = 1500;

/** Pausa educada com jitter entre requests por termo — não martelar sites/APIs. */
export function politeDelay(): Promise<void> {
  return new Promise((r) => setTimeout(r, SCRAPE_DELAY_MS + Math.random() * SCRAPE_DELAY_MS));
}

/**
 * Roda uma fonte-por-termo com **kill-switch por fonte**, distinguindo:
 *  - fonte INACESSÍVEL (chave ausente / HTTP 4xx, ex.: jsearch sem subscribe) → `break`:
 *    não adianta tentar as outras queries, e evita 1 aviso por termo (só 1 no total);
 *  - falha PONTUAL (rede/5xx/payload atípico de uma query) → registra e segue para a
 *    próxima query — não derruba a cobertura da fonte por um tropeço isolado.
 * Delay educado ANTES de cada query (menos a 1ª). `delay` é injetável p/ teste.
 * @param acc acumulador mutado in-place (raws, errors, perSource).
 */
export async function collectQuerySource(
  name: string,
  fetchFn: QuerySource,
  queries: string[],
  acc: CollectAcc,
  delay: () => Promise<void> = politeDelay,
): Promise<void> {
  let first = true;
  for (const query of queries) {
    if (!first) await delay();
    first = false;
    try {
      const jobsFromQuery = await fetchFn(query);
      acc.raws.push(...jobsFromQuery);
      acc.perSource[name] = (acc.perSource[name] ?? 0) + jobsFromQuery.length;
    } catch (e) {
      const msg = (e as Error).message;
      acc.errors.push(`${name}:"${query}" — ${msg}`);
      // "ausente" (requireEnv) e HTTP 4xx = fonte inacessível: não martela as demais.
      if (/ausente|HTTP 4\d\d/.test(msg)) break;
    }
  }
}

/** Remove duplicatas da própria coleta por (source, sourceJobId), mantendo a última. */
export function dedupRaws(raws: RawJobFromATS[]): RawJobFromATS[] {
  const seen = new Map<string, RawJobFromATS>();
  for (const r of raws) seen.set(`${r.source} ${r.sourceJobId}`, r);
  return [...seen.values()];
}
