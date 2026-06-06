import { z } from "zod";
import { rawJobSchema, type RawJobFromATS } from "./types";
import { fetchJsonWithRetry } from "./http";
import { requireEnv } from "@/lib/env";

/**
 * Connector do JSearch (RapidAPI) — Google for Jobs agregado, cobre LinkedIn/Indeed.
 *   GET https://jsearch.p.rapidapi.com/search?query=...  (header X-RapidAPI-Key)
 * A chave (RAPIDAPI_KEY) precisa estar SUBSCRITA ao JSearch no RapidAPI; sem o
 * subscribe a API responde 403 "not subscribed" (gate humano da Onda 8).
 */
const SOURCE = "jsearch";
const HOST = "jsearch.p.rapidapi.com";

// Schema de ENTRADA tolerante (job_apply_link pode vir null); a validação dura é na saída.
const jsearchJobSchema = z.object({
  job_id: z.string().nullish(),
  job_title: z.string().nullish(),
  job_apply_link: z.string().nullish(),
  employer_name: z.string().nullish(),
  job_employment_type: z.string().nullish(),
  job_city: z.string().nullish(),
  job_state: z.string().nullish(),
  job_country: z.string().nullish(),
  job_posted_at_datetime_utc: z.string().nullish(),
});
type JsearchJob = z.infer<typeof jsearchJobSchema>;
const jsearchResponseSchema = z.object({ data: z.array(jsearchJobSchema) });

function buildLocation(j: JsearchJob): string | null {
  const parts = [j.job_city, j.job_state, j.job_country].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

/** job_employment_type (FULLTIME|PARTTIME|CONTRACTOR|INTERN). Só INTERN é certo. */
function hintFromType(type: string | null | undefined): RawJobFromATS["employmentTypeHint"] {
  return (type ?? "").toUpperCase() === "INTERN" ? "estagio" : null;
}

/** Converte a resposta do JSearch em RawJobFromATS[]. Valida cada item contra o contrato. */
export function parseJsearch(raw: unknown): RawJobFromATS[] {
  const data = jsearchResponseSchema.parse(raw);
  const out: RawJobFromATS[] = [];
  for (const j of data.data) {
    const candidate = rawJobSchema.safeParse({
      source: SOURCE,
      sourceJobId: (j.job_id ?? "").trim(),
      applyUrl: (j.job_apply_link ?? "").trim(),
      company: (j.employer_name ?? "").trim() || "Empresa não informada",
      title: (j.job_title ?? "").trim(),
      locationRaw: buildLocation(j),
      updatedAt: j.job_posted_at_datetime_utc ?? null,
      employmentTypeHint: hintFromType(j.job_employment_type),
    });
    if (candidate.success) out.push(candidate.data);
  }
  if (data.data.length > 0 && out.length === 0) {
    throw new Error(`jsearch: ${data.data.length} itens e 0 válidos — shape mudou`);
  }
  return out;
}

/** Busca vagas no JSearch por termo (com retry). Lança em falha/HTTP != 2xx (403 = sem subscribe). */
export async function fetchJsearchJobs(query: string): Promise<RawJobFromATS[]> {
  const key = requireEnv("RAPIDAPI_KEY");
  const url = new URL("https://jsearch.p.rapidapi.com/search");
  url.searchParams.set("query", `${query} in Brazil`);
  url.searchParams.set("page", "1");
  url.searchParams.set("num_pages", "1");
  const data = await fetchJsonWithRetry(url, `jsearch "${query}"`, {
    headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": HOST },
  });
  return parseJsearch(data);
}
