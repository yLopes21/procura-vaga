import { z } from "zod";
import type { RawJobFromATS } from "./types";

/**
 * Connector do Gupy (maior plataforma de vagas/estágio do Brasil).
 * Diferente dos ATS (por board/empresa), o Gupy expõe um PORTAL DE BUSCA público:
 *   GET https://employability-portal.gupy.io/api/v1/jobs?offset&limit&jobName
 * Por isso a ingestão chama por TERMO de busca (ex.: "estágio administração"),
 * não por empresa. Vantagem: já traz o `type` (estágio/efetivo/trainee) e local.
 */
const SOURCE = "gupy";
const PORTAL = "https://employability-portal.gupy.io/api/v1/jobs";

/** Tradução do `type` do Gupy para a dica de vínculo do contrato. */
const GUPY_TYPE: Record<string, "estagio" | "trainee" | "efetivo"> = {
  vacancy_type_internship: "estagio",
  vacancy_type_effective: "efetivo",
  vacancy_type_trainee: "trainee",
  vacancy_type_young_apprentice: "trainee",
};

const gupyJobSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  careerPageName: z.string().nullish(),
  type: z.string().nullish(),
  publishedDate: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  country: z.string().nullish(),
  jobUrl: z.string().url(),
});

const gupyResponseSchema = z.object({ data: z.array(gupyJobSchema) });

function buildLocation(j: z.infer<typeof gupyJobSchema>): string | null {
  const parts = [j.city, j.state, j.country].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * Converte a resposta crua do portal Gupy em RawJobFromATS[]. Valida com Zod e
 * **lança** em divergência (fail loud) — nunca devolve [] em silêncio (PM-08).
 */
export function parseGupy(raw: unknown): RawJobFromATS[] {
  const data = gupyResponseSchema.parse(raw);
  return data.data.map((j) => ({
    source: SOURCE,
    sourceJobId: String(j.id),
    applyUrl: j.jobUrl,
    company: j.careerPageName ?? "Gupy",
    title: j.name,
    locationRaw: buildLocation(j),
    updatedAt: j.publishedDate ?? null,
    employmentTypeHint: j.type ? (GUPY_TYPE[j.type] ?? null) : null,
  }));
}

/**
 * Busca vagas no portal público do Gupy por termo (paginado por offset/limit).
 * A ingestão chama isto com os termos do perfil do Rodrigo.
 */
export async function fetchGupyJobs(
  jobName: string,
  opts: { offset?: number; limit?: number } = {},
): Promise<RawJobFromATS[]> {
  const { offset = 0, limit = 50 } = opts;
  const url = `${PORTAL}?offset=${offset}&limit=${limit}&jobName=${encodeURIComponent(jobName)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`gupy "${jobName}": HTTP ${res.status}`);
  return parseGupy(await res.json());
}
