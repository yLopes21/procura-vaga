/**
 * Allowlist de login — verificada NO SERVIDOR (callback `signIn` do Auth.js),
 * nunca só na UI. Fail-closed: sem `ALLOWED_EMAIL` configurado, ou e-mail
 * ausente, NINGUÉM entra. É o que mantém o app privado (só o Rodrigo) e
 * protege as cotas grátis das APIs contra uso de terceiros.
 */
export function isEmailAllowed(
  email: string | null | undefined,
  allowed: string | undefined,
): boolean {
  if (!email || !allowed) return false;
  return email.trim().toLowerCase() === allowed.trim().toLowerCase();
}
