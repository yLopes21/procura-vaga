/**
 * Detector de vaga fechada — núcleo da garantia "nunca mostrar vaga morta".
 * Decide aberto/fechado/desconhecido a partir do resultado de UM fetch
 * on-demand da apply_url (disparado pelo clique do usuário).
 *
 * Princípio fail-closed: na dúvida com sinal de fechamento, fecha. Sem sinal
 * mas sem resposta (rede/timeout/5xx) → "unknown" (não libera às cegas).
 */

export type JobStatus = "open" | "closed" | "unknown";

export interface ValidationInput {
  /** Status HTTP final; 0 = sem resposta (rede/timeout). */
  httpStatus: number;
  /** apply_url canônica esperada. */
  expectedUrl: string;
  /** URL final após seguir redirects. */
  finalUrl: string;
  /** Texto visível da página (qualquer caixa). */
  bodyText: string;
}

export interface ValidationResult {
  status: JobStatus;
  reason: string;
}

/** Marcadores bilíngues de fechamento (comparados em minúsculas). */
const CLOSED_MARKERS: readonly string[] = [
  // PT
  "vaga encerrada",
  "vaga foi encerrada",
  "processo seletivo encerrado",
  "processo encerrado",
  "vaga não encontrada",
  "vaga indisponível",
  "não está mais disponível",
  "candidaturas encerradas",
  "inscrições encerradas",
  "vaga preenchida",
  "vaga expirada",
  // EN
  "no longer accepting",
  "no longer available",
  "position has been filled",
  "this position is closed",
  "job is no longer",
  "applications are closed",
  "requisition is closed",
  "posting is closed",
  "this job has expired",
  "job has been closed",
  "no longer posted",
  "no longer open",
  "we have filled",
  // PT extras
  "oportunidade foi finalizada",
  "oportunidade finalizada",
  "processo finalizado",
  "vaga finalizada",
  "vaga concluída",
];

/**
 * Sinal POSITIVO de vaga aberta: CTA de candidatura (PM-01, régua agressiva).
 * Sem este sinal, uma página 200 sem marcador de fechamento NÃO é declarada
 * "open" — vira "unknown" (fail-closed: prefere esconder na dúvida).
 */
const OPEN_CTA =
  /candidate-se|candidatar|candidatura|inscreva-se|inscri[çc][ãa]o|aplicar|\bapply\b|apply now|submit application|enviar candidatura/i;

/** Segmentos de path que indicam landing genérica / "similares" (redirect = fechada). */
const GENERIC_LANDING = /^\/(jobs|careers|vagas|carreiras|search|home|busca)?\/?$/i;
const SIMILAR_OR_EXPIRED = /(similar|expired|not-?found|404|encerrad)/i;

function pathDepth(pathname: string): number {
  return pathname.split("/").filter(Boolean).length;
}

function isRedirectToGeneric(expectedUrl: string, finalUrl: string): boolean {
  let expected: URL;
  let final: URL;
  try {
    expected = new URL(expectedUrl);
    final = new URL(finalUrl);
  } catch {
    return false;
  }
  // Ignora querystring; compara host + path.
  if (expected.host === final.host && expected.pathname === final.pathname) return false;

  // Redirecionou para home/listagem genérica.
  if (GENERIC_LANDING.test(final.pathname)) return true;
  // Redirecionou para "similares"/"expirada"/"não encontrada".
  if (SIMILAR_OR_EXPIRED.test(final.href)) return true;
  // Redirecionou para um path raso (perdeu o id da vaga) no mesmo host.
  if (expected.host === final.host && pathDepth(final.pathname) < pathDepth(expected.pathname))
    return true;

  return false;
}

export function classifyJobStatus(input: ValidationInput): ValidationResult {
  const { httpStatus, expectedUrl, finalUrl, bodyText } = input;

  if (httpStatus === 0) return { status: "unknown", reason: "sem resposta (rede/timeout)" };
  if (httpStatus === 404 || httpStatus === 410)
    return { status: "closed", reason: `HTTP ${httpStatus}` };
  if (httpStatus >= 500) return { status: "unknown", reason: `erro de servidor ${httpStatus}` };

  if (isRedirectToGeneric(expectedUrl, finalUrl))
    return { status: "closed", reason: `redirect para landing/listagem: ${finalUrl}` };

  const haystack = bodyText.toLowerCase();
  const marker = CLOSED_MARKERS.find((m) => haystack.includes(m));
  if (marker) return { status: "closed", reason: `marcador de fechamento: "${marker}"` };

  // PM-01: só "open" com sinal positivo de candidatura. Página 200 sem marcador
  // de fechamento mas sem CTA (shell de SPA, texto genérico) → "unknown".
  if (OPEN_CTA.test(bodyText)) return { status: "open", reason: "CTA de candidatura presente" };
  return { status: "unknown", reason: "sem marcador de fechamento, mas sem CTA de candidatura" };
}

/** Vocabulário da coluna `jobs.status` no banco (distinto do detector). */
export type DbJobStatus = "active" | "closed" | "unknown";

/**
 * Mapeia o veredito do detector ("open") para o vocabulário do banco ("active").
 * O detector usa "open/closed/unknown"; a coluna jobs.status usa
 * "active/closed/unknown" (VF-04). A escrita no catálogo passa por aqui.
 */
export function toDbStatus(status: JobStatus): DbJobStatus {
  return status === "open" ? "active" : status;
}
