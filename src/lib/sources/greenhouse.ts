import { z } from "zod";
import type { JobSource, RawJobFromATS } from "./types";

/**
 * Connector do Greenhouse (API pública oficial de job board — não é scraping).
 * Endpoint: https://boards-api.greenhouse.io/v1/boards/{board}/jobs
 */
const SOURCE = "greenhouse";

const greenhouseJobSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  absolute_url: z.string().url(),
  location: z.object({ name: z.string() }).nullish(),
  updated_at: z.string().nullish(),
  company_name: z.string().nullish(),
});

const greenhouseResponseSchema = z.object({ jobs: z.array(greenhouseJobSchema) });

/**
 * Converte a resposta crua do Greenhouse em RawJobFromATS[]. Valida o shape com
 * Zod e **lança** em divergência (fail loud) — nunca devolve lista vazia em
 * silêncio mascarando uma mudança de API (PM-08).
 */
export function parseGreenhouse(raw: unknown, board: string): RawJobFromATS[] {
  const data = greenhouseResponseSchema.parse(raw);
  return data.jobs.map((j) => ({
    source: SOURCE,
    sourceJobId: String(j.id),
    applyUrl: j.absolute_url,
    company: j.company_name ?? board,
    title: j.title,
    locationRaw: j.location?.name ?? null,
    updatedAt: j.updated_at ?? null,
  }));
}

export const greenhouse: JobSource = {
  source: SOURCE,
  async fetchJobs(board: string): Promise<RawJobFromATS[]> {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`greenhouse ${board}: HTTP ${res.status}`);
    return parseGreenhouse(await res.json(), board);
  },
};
