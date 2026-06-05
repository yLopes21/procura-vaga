/**
 * Política de fechamento do catálogo — resiliente a coleta parcial (P0-1c).
 *
 * Em vez de fechar tudo que "sumiu" numa única coleta (frágil: um connector que
 * falha faria todas as vagas da fonte sumirem e serem fechadas por engano),
 * fechamos só o que NÃO é visto há mais de N dias — e abortamos a rodada inteira
 * se ela fecharia uma fração grande demais das vagas (sinal de coleta quebrada).
 */
export interface JobSnapshot {
  id: string;
  status: string;
  lastSeenAt: Date;
}

/** IDs de vagas `active` cujo `lastSeenAt` é mais antigo que `maxAgeDays`. */
export function staleJobIds(jobs: JobSnapshot[], now: Date, maxAgeDays: number): string[] {
  const cutoff = now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000;
  return jobs
    .filter((j) => j.status === "active" && j.lastSeenAt.getTime() < cutoff)
    .map((j) => j.id);
}

/**
 * Circuit-breaker: aborta o fechamento se ele atingiria mais que `maxFraction`
 * das vagas ativas — provável falha de coleta, não vagas realmente fechando.
 */
export function shouldAbortClosing(
  toClose: number,
  totalActive: number,
  maxFraction = 0.5,
): boolean {
  if (totalActive <= 0) return false;
  return toClose / totalActive > maxFraction;
}

/**
 * Coleta vazia nesta rodada = nenhuma evidência de que vagas foram removidas
 * (provável falha total de rede/bloqueio). Fechar por defasagem nesse caso
 * marcaria vagas válidas como `closed` em silêncio — então NÃO se fecha nada.
 * Defesa complementar ao `shouldAbortClosing` (que só pega falha parcial grande).
 */
export function collectionLooksBroken(collectedNow: number): boolean {
  return collectedNow <= 0;
}
