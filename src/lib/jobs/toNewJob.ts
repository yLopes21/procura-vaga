import type { RawJobFromATS } from "@/lib/sources/types";
import type { NewJob } from "@/lib/db/schema";
import { classifyEmploymentType, classifySeniority } from "@/lib/taxonomy/classify";
import { normalizeLocation } from "./location";
import { dedupClusterKey } from "./dedup";

/**
 * Enriquece uma vaga crua (RawJobFromATS) na linha do catálogo (NewJob). É AQUI
 * que os módulos de normalização se encontram (location, dedup, classify) — o
 * connector só entrega dado cru; o tipo do banco nasce neste mapeamento.
 *
 * `employmentType`: usa a dica da fonte (Gupy) quando há; senão classifica pelo
 * título. `confidence` reflete se houve sinal forte (hint ou classificação != unknown).
 */
const titleNorm = (t: string): string =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

export function toNewJob(raw: RawJobFromATS): NewJob {
  const loc = normalizeLocation(raw.locationRaw);
  const employmentType = raw.employmentTypeHint ?? classifyEmploymentType(raw.title);
  const seniority = classifySeniority(raw.title);
  const confident = Boolean(raw.employmentTypeHint) || employmentType !== "unknown";

  return {
    source: raw.source,
    sourceJobId: raw.sourceJobId,
    applyUrl: raw.applyUrl,
    company: raw.company,
    title: raw.title,
    titleNorm: titleNorm(raw.title),
    locationUf: loc.uf,
    locationCity: loc.city,
    remoteFlag: loc.remote,
    employmentType,
    seniority,
    cineArea: null,
    confidence: confident ? "high" : "low",
    dedupClusterId: dedupClusterKey({ company: raw.company, title: raw.title, uf: loc.uf }),
  };
}
