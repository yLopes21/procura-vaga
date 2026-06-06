import { timingSafeEqual } from "node:crypto";

/**
 * Valida o header Authorization de um disparo de cron contra "Bearer <secret>",
 * em tempo CONSTANTE (timingSafeEqual evita timing oracle). O Vercel Cron injeta
 * esse header automaticamente quando a env CRON_SECRET existe. Fail-closed: secret
 * vazio/ausente nunca autoriza.
 */
export function isAuthorizedCron(authHeader: string | null, secret: string): boolean {
  if (!secret) return false;
  const a = Buffer.from(authHeader ?? "");
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
