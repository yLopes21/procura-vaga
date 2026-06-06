import { z } from "zod";
import { rawJobSchema, type RawJobFromATS } from "./types";
import { fetchJsonWithRetry } from "./http";
import { requireEnv } from "@/lib/env";

/**
 * Connector da Adzuna (agregador com cobertura BR). Busca por TERMO:
 *   GET https://api.adzuna.com/v1/api/jobs/br/search/1?app_id=&app_key=&what=...
 * Precisa de ADZUNA_APP_ID + ADZUNA_APP_KEY (cadastro grátis em developer.adzuna.com) —
 * gate humano da Onda 8.
 */
const SOURCE = "adzuna";

// Schema de ENTRADA tolerante; a validação dura é na saída (item a item).
const adzunaJobSchema = z.object({
  id: z.union([z.string(), z.number()]).nullish(),
  title: z.string().nullish(),
  redirect_url: z.string().nullish(),
  company: z.object({ display_name: z.string().nullish() }).nullish(),
  location: z.object({ display_name: z.string().nullish() }).nullish(),
  created: z.string().nullish(),
});
const adzunaResponseSchema = z.object({ results: z.array(adzunaJobSchema) });

/** Converte a resposta da Adzuna em RawJobFromATS[]. Valida cada item contra o contrato. */
export function parseAdzuna(raw: unknown): RawJobFromATS[] {
  const data = adzunaResponseSchema.parse(raw);
  const out: RawJobFromATS[] = [];
  for (const j of data.results) {
    const candidate = rawJobSchema.safeParse({
      source: SOURCE,
      sourceJobId: j.id != null ? String(j.id) : "",
      applyUrl: (j.redirect_url ?? "").trim(),
      company: (j.company?.display_name ?? "").trim() || "Empresa não informada",
      title: (j.title ?? "").trim(),
      locationRaw: (j.location?.display_name ?? "").trim() || null,
      updatedAt: j.created ?? null,
      employmentTypeHint: null, // Adzuna expõe contract_time (part/full), que não mapeia o vínculo BR
    });
    if (candidate.success) out.push(candidate.data);
  }
  if (data.results.length > 0 && out.length === 0) {
    throw new Error(`adzuna: ${data.results.length} itens e 0 válidos — shape mudou`);
  }
  return out;
}

/** Busca vagas na Adzuna por termo (com retry). Lança em falha/HTTP != 2xx. */
export async function fetchAdzunaJobs(query: string): Promise<RawJobFromATS[]> {
  const appId = requireEnv("ADZUNA_APP_ID");
  const appKey = requireEnv("ADZUNA_APP_KEY");
  const url = new URL("https://api.adzuna.com/v1/api/jobs/br/search/1");
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("what", query);
  url.searchParams.set("results_per_page", "50");
  url.searchParams.set("content-type", "application/json");
  const data = await fetchJsonWithRetry(url, `adzuna "${query}"`);
  return parseAdzuna(data);
}
