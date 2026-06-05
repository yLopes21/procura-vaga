import { z } from "zod";
import type { JobSource, RawJobFromATS } from "./types";

/**
 * Connector do Lever (API pública oficial de postings — não é scraping).
 * Endpoint: https://api.lever.co/v0/postings/{company}?mode=json
 *
 * Peculiaridade vs Greenhouse: a resposta é um ARRAY FLAT no topo (não
 * `{ jobs: [] }`), e `createdAt` vem como epoch em milissegundos (number).
 */
const SOURCE = "lever";

const leverPostingSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  hostedUrl: z.string().url(),
  applyUrl: z.string().url().nullish(),
  categories: z.object({ location: z.string().nullish() }).nullish(),
  createdAt: z.number().nullish(),
});

const leverResponseSchema = z.array(leverPostingSchema);

/**
 * Converte a resposta crua do Lever em RawJobFromATS[]. Valida o shape com Zod
 * e **lança** em divergência (fail loud) — nunca devolve lista vazia em
 * silêncio mascarando uma mudança de API (PM-08).
 */
export function parseLever(raw: unknown, board: string): RawJobFromATS[] {
  const postings = leverResponseSchema.parse(raw);
  return postings.map((p) => ({
    source: SOURCE,
    sourceJobId: String(p.id),
    applyUrl: p.applyUrl ?? p.hostedUrl,
    company: board,
    title: p.text,
    locationRaw: p.categories?.location ?? null,
    updatedAt: p.createdAt != null ? new Date(p.createdAt).toISOString() : null,
  }));
}

export const lever: JobSource = {
  source: SOURCE,
  async fetchJobs(board: string): Promise<RawJobFromATS[]> {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(board)}?mode=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`lever ${board}: HTTP ${res.status}`);
    return parseLever(await res.json(), board);
  },
};
