import { z } from "zod";
import type { JobSource, RawJobFromATS } from "./types";

/**
 * Connector do Ashby (Posting API pública oficial — não é scraping).
 * Endpoint: https://api.ashbyhq.com/posting-api/job-board/{name}?includeCompensation=false
 * Atenção: o nome do board é case-sensitive (ex.: "Ramp", não "ramp").
 */
const SOURCE = "ashby";

const ashbyJobSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    location: z.string().nullish(),
    jobUrl: z.string().url().nullish(),
    applyUrl: z.string().url().nullish(),
    publishedAt: z.string().nullish(),
  })
  // applyUrl é o campo de candidatura; jobUrl é o fallback. Exigir ao menos um
  // (fail loud) em vez de mapear para "" e quebrar só na ingestão.
  .refine((j) => Boolean(j.applyUrl ?? j.jobUrl), {
    message: "ashby job sem applyUrl nem jobUrl",
  });

const ashbyResponseSchema = z.object({ jobs: z.array(ashbyJobSchema) });

/**
 * Converte a resposta crua do Ashby em RawJobFromATS[]. Valida o shape com Zod e
 * **lança** em divergência (fail loud) — nunca devolve lista vazia em silêncio
 * mascarando uma mudança de API (PM-08). Usa o nome do board como `company`,
 * pois a Posting API não expõe o nome da empresa por vaga.
 */
export function parseAshby(raw: unknown, board: string): RawJobFromATS[] {
  const data = ashbyResponseSchema.parse(raw);
  return data.jobs.map((j) => ({
    source: SOURCE,
    sourceJobId: String(j.id),
    applyUrl: j.applyUrl ?? j.jobUrl ?? "",
    company: board,
    title: j.title,
    locationRaw: j.location ?? null,
    updatedAt: j.publishedAt ?? null,
  }));
}

export const ashby: JobSource = {
  source: SOURCE,
  async fetchJobs(board: string): Promise<RawJobFromATS[]> {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}?includeCompensation=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`ashby ${board}: HTTP ${res.status}`);
    return parseAshby(await res.json(), board);
  },
};
