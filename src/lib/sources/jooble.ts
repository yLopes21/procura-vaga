import { z } from "zod";
import { rawJobSchema, type RawJobFromATS } from "./types";
import { fetchJsonWithRetry } from "./http";
import { requireEnv } from "@/lib/env";

/**
 * Connector do Jooble (agregador global). Portal de busca por TERMO via POST:
 *   POST https://jooble.org/api/<KEY>   body { keywords, location }
 * Conexão intermitente (ECONNRESET) → fetchJsonWithRetry resolve. Cobertura BR é
 * fraca para estágio hoje (ver TECH_DEBT); o connector entrega o que a fonte der.
 */
const SOURCE = "jooble";

// Schema de ENTRADA tolerante (a API varia): campos opcionais. A validação dura é
// feita na SAÍDA, item a item, contra rawJobSchema (o contrato congelado) — item
// fora do contrato é descartado; se a página tinha itens e nenhum valida, lança.
const joobleJobSchema = z.object({
  title: z.string().nullish(),
  location: z.string().nullish(),
  link: z.string().nullish(),
  company: z.string().nullish(),
  type: z.string().nullish(),
  updated: z.string().nullish(),
  // id numérico estoura Number.MAX_SAFE_INTEGER e chega truncado — NÃO usar.
  id: z.union([z.number(), z.string()]).nullish(),
});
const joobleResponseSchema = z.object({ jobs: z.array(joobleJobSchema) });

/** O id íntegro está no link (/jdp/<id>); o campo `id` numérico vem truncado. */
function jobIdFromLink(link: string): string {
  return link.match(/\/jdp\/(\d+)/)?.[1] ?? link;
}

/** Traduz o `type` do Jooble (texto livre PT) para a dica de vínculo do contrato. */
function hintFromType(type: string | null | undefined): RawJobFromATS["employmentTypeHint"] {
  const t = (type ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (t.includes("estagi")) return "estagio";
  if (t.includes("trainee") || t.includes("aprendiz")) return "trainee";
  return null;
}

/** Converte a resposta do Jooble em RawJobFromATS[]. Valida cada item contra o contrato. */
export function parseJooble(raw: unknown): RawJobFromATS[] {
  const data = joobleResponseSchema.parse(raw);
  const out: RawJobFromATS[] = [];
  for (const j of data.jobs) {
    const link = (j.link ?? "").trim();
    const candidate = rawJobSchema.safeParse({
      source: SOURCE,
      sourceJobId: link ? jobIdFromLink(link) : "",
      applyUrl: link,
      company: (j.company ?? "").trim() || "Empresa não informada",
      title: (j.title ?? "").trim(),
      locationRaw: (j.location ?? "").trim() || null,
      updatedAt: j.updated ?? null,
      employmentTypeHint: hintFromType(j.type),
    });
    if (candidate.success) out.push(candidate.data);
  }
  if (data.jobs.length > 0 && out.length === 0) {
    throw new Error(`jooble: ${data.jobs.length} itens e 0 válidos — shape mudou`);
  }
  return out;
}

/** Busca vagas no Jooble por termo (POST autenticado, com retry). Lança em falha/HTTP != 2xx. */
export async function fetchJoobleJobs(query: string, location = ""): Promise<RawJobFromATS[]> {
  const key = requireEnv("JOOBLE_API_KEY");
  const data = await fetchJsonWithRetry(
    `https://jooble.org/api/${key}`,
    `jooble "${query}"`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: query, location }),
    },
    { retries: 3 },
  );
  return parseJooble(data);
}
