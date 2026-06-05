import { z } from "zod";

/**
 * Contrato CRU congelado de uma vaga vinda de uma fonte (ATS/scraper), ANTES do
 * enriquecimento. O connector preenche só o que a fonte expõe diretamente; a
 * normalização (location→UF, tipo/senioridade, área CINE, dedup) acontece na
 * ingestão (Onda 3), onde os módulos jobs/* e taxonomy/* existem.
 *
 * Mantido SEPARADO de `NewJob` (db/schema, o insert do banco) de propósito:
 * são tipos distintos (saída do connector vs linha do catálogo). Unificá-los
 * recriaria a divergência apontada na revisão (P1-1/VF-03).
 */
export const rawJobSchema = z.object({
  source: z.string().min(1),
  sourceJobId: z.string().min(1),
  applyUrl: z.string().url(),
  company: z.string().min(1),
  title: z.string().min(1),
  /** Texto cru de localização da fonte (normalizado depois por jobs/location). */
  locationRaw: z.string().nullable(),
  /** ISO da última atualização na fonte, se exposto. */
  updatedAt: z.string().nullable(),
});

export type RawJobFromATS = z.infer<typeof rawJobSchema>;

/** Toda fonte de vagas (ATS ou scraper) implementa esta interface. */
export interface JobSource {
  readonly source: string;
  /** Busca as vagas de um board/empresa. Lança em shape inválido (fail loud). */
  fetchJobs(company: string): Promise<RawJobFromATS[]>;
}

/**
 * Resultado de uma coleta — sucesso traz `jobs`, falha traz `error`. Permite
 * acumular erros por fonte sem abortar as demais (PM-08): o orquestrador da
 * ingestão coleta todos e reporta os que falharam no digest.
 */
export interface SourceResult {
  source: string;
  company: string;
  jobs: RawJobFromATS[];
  error?: string;
}
