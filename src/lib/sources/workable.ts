import { z } from "zod";
import type { JobSource, RawJobFromATS } from "./types";

/**
 * Connector do Workable (API pública v3 do board hospedado — não é scraping).
 * Endpoint: POST https://apply.workable.com/api/v3/accounts/{subdomain}/jobs
 * O `{subdomain}` é o segmento do board (ex.: "careers"), não o nome da marca.
 * A resposta traz { total, results: [...] }; mapeamos `results` (as vagas
 * publicadas listadas), nunca `total` (contagem que pode incluir filtragem).
 */
const SOURCE = "workable";

/**
 * Shape cru de localização do v3. `country`/`countryCode` sempre presentes;
 * `city`/`region` podem ser nulos. O objeto inteiro é nullish (vaga sem local).
 */
const workableLocationSchema = z
  .object({
    country: z.string().nullish(),
    region: z.string().nullish(),
    city: z.string().nullish(),
  })
  .nullish();

const workableJobSchema = z.object({
  id: z.number(),
  shortcode: z.string().nullish(),
  title: z.string().min(1),
  location: workableLocationSchema,
  /** ISO de publicação da vaga (campo real é `published`, não `published_on`). */
  published: z.string().nullish(),
});

const workableResponseSchema = z.object({
  results: z.array(workableJobSchema),
});

/**
 * Monta o texto cru de localização juntando city → region → country (partes não
 * vazias), ex.: "Boston, Massachusetts, United States". Retorna null se nada útil.
 */
function buildLocationRaw(
  location: z.infer<typeof workableLocationSchema>,
): string | null {
  if (!location) return null;
  const parts = [location.city, location.region, location.country].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * Converte a resposta crua do Workable em RawJobFromATS[]. Valida o shape com
 * Zod e **lança** em divergência (fail loud) — nunca devolve lista vazia em
 * silêncio mascarando uma mudança de API (PM-08).
 *
 * @param raw resposta JSON do endpoint v3
 * @param subdomain segmento do board, usado para montar a applyUrl e como
 *   fallback de `company` (o v3 não expõe nome de empresa por vaga).
 */
export function parseWorkable(
  raw: unknown,
  subdomain: string,
): RawJobFromATS[] {
  const data = workableResponseSchema.parse(raw);
  return data.results.map((j) => {
    const sourceJobId = j.shortcode ?? String(j.id);
    return {
      source: SOURCE,
      sourceJobId,
      applyUrl: `https://apply.workable.com/${subdomain}/j/${sourceJobId}/`,
      company: subdomain,
      title: j.title,
      locationRaw: buildLocationRaw(j.location),
      updatedAt: j.published ?? null,
    };
  });
}

export const workable: JobSource = {
  source: SOURCE,
  async fetchJobs(subdomain: string): Promise<RawJobFromATS[]> {
    const url = `https://apply.workable.com/api/v3/accounts/${encodeURIComponent(
      subdomain,
    )}/jobs`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`workable ${subdomain}: HTTP ${res.status}`);
    return parseWorkable(await res.json(), subdomain);
  },
};
