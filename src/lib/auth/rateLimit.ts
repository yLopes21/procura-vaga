/**
 * Rate-limiter in-memory de janela fixa. Limita LIMITE chamadas por `key`
 * a cada JANELA ms; após a janela, a contagem zera.
 *
 * `now` é injetável (ms) só para tornar o teste de reset determinístico —
 * sem ele, esperaríamos 60s reais. Em produção, omitir `now` usa o relógio
 * do sistema.
 *
 * BEST-EFFORT (tech-debt): o Map vive na memória da instância. Em ambiente
 * serverless (Vercel) cada instância/cold-start tem o seu próprio Map, então
 * a contagem NÃO é compartilhada entre instâncias e não sobrevive a restart.
 * Não é a defesa real contra abuso de login — o gate de verdade é
 * senha + ausência de signup + anti-enumeração (allowlist fail-closed). Este
 * limiter só corta tentativas grosseiras de força-bruta na mesma instância.
 */

const LIMITE = 5;
const JANELA = 60_000; // 60s em ms

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  now: number = Date.now(),
): { allowed: boolean } {
  let bucket = buckets.get(key);

  // primeiro acesso ou janela expirada → (re)inicia a janela
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + JANELA };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  return { allowed: bucket.count <= LIMITE };
}
