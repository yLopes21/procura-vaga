import type { ValidationInput } from "./closeSignals";

const PRIVATE_IPV4 = /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

/**
 * Anti-SSRF (1ª camada): só http(s) para host PÚBLICO. Bloqueia localhost,
 * loopback, IPs privados/link-local e o endpoint de metadata da cloud
 * (169.254.169.254). NÃO cobre DNS rebinding (ver TECH_DEBT) — a apply_url vem
 * de ATS externos conhecidos, então o vetor é baixo, mas a guarda existe.
 */
export function isSafeApplyUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost")) return false;

  if (host.includes(":")) {
    // IPv6: bloqueia loopback (::1) e ULA (fc00::/7); demais IPv6 públicos passam.
    return !(host === "::1" || host.startsWith("fc") || host.startsWith("fd"));
  }

  if (!host.includes(".")) return false; // hostname interno sem ponto
  return !PRIVATE_IPV4.test(host);
}

const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY = 200_000; // 200 KB bastam para os marcadores de fechamento
const MAX_REDIRECT_HOPS = 5;

/**
 * 1 fetch on-demand da apply_url → ValidationInput para classifyJobStatus.
 * Segue redirects MANUALMENTE re-validando cada hop com isSafeApplyUrl — senão
 * um redirect da apply_url (pública) para 169.254.169.254/localhost burlaria a
 * allowlist (SSRF redirect bypass). Timeout + corpo limitado. Nunca lança:
 * rede/erro/redirect inseguro/loop → httpStatus 0 (detector trata como
 * "unknown", fail-closed). URL inicial insegura → null.
 */
export async function fetchValidation(applyUrl: string): Promise<ValidationInput | null> {
  if (!isSafeApplyUrl(applyUrl)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const failClosed = (finalUrl: string): ValidationInput => ({
    httpStatus: 0,
    expectedUrl: applyUrl,
    finalUrl,
    bodyText: "",
  });

  try {
    let currentUrl = applyUrl;
    for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop++) {
      const res = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": "Mozilla/5.0 (compatible; ProcuraVagaBot/1.0)" },
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) {
          return { httpStatus: res.status, expectedUrl: applyUrl, finalUrl: currentUrl, bodyText: "" };
        }
        const next = new URL(location, currentUrl).toString();
        // Re-valida o DESTINO antes de seguir — bloqueia o bypass de allowlist via redirect.
        if (!isSafeApplyUrl(next)) return failClosed(next);
        currentUrl = next;
        continue;
      }

      const body = await res.text();
      return {
        httpStatus: res.status,
        expectedUrl: applyUrl,
        finalUrl: currentUrl,
        bodyText: body.slice(0, MAX_BODY),
      };
    }
    // Excedeu o limite de hops (provável loop de redirect) → fail-closed.
    return failClosed(currentUrl);
  } catch {
    return failClosed(applyUrl);
  } finally {
    clearTimeout(timer);
  }
}
