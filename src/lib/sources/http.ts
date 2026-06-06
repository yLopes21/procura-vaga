/**
 * UA de browser real usado pelos scrapers de HTML público (Vagas.com, InfoJobs).
 * Esses sites respondem 200 com um UA de navegador e bloqueiam clientes "headless"
 * óbvios. Ponto único para atualizar caso algum endpoint passe a exigir outro.
 */
export const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** Timeout padrão de scraping (ms) — páginas HTML completas são maiores que JSON de ATS. */
export const SCRAPE_TIMEOUT_MS = 20_000;

export interface FetchHtmlOptions {
  /** Tentativas extras após a primeira (default 2 → até 3 chamadas). */
  retries?: number;
  /** Base do backoff linear entre tentativas, em ms (default 800). */
  backoffMs?: number;
  /** Timeout total por tentativa, em ms. */
  timeoutMs?: number;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * GET de uma página HTML com User-Agent de browser e **retry com backoff**.
 *
 * Motivação (verificado ao vivo): o handshake inicial com alguns portais
 * (InfoJobs, e ATS pontualmente) estoura o connectTimeout do undici de forma
 * transitória (`UND_ERR_CONNECT_TIMEOUT`); a 2ª tentativa quase sempre conecta.
 * Erros de rede e HTTP 5xx são retentados; HTTP 4xx (erro do cliente) falha na
 * hora — retentar não muda o resultado. Lança o último erro se esgotar (fail loud).
 */
export async function fetchHtmlWithRetry(
  url: string | URL,
  label: string,
  opts: FetchHtmlOptions = {},
): Promise<string> {
  const { retries = 2, backoffMs = 800, timeoutMs = SCRAPE_TIMEOUT_MS } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": BROWSER_UA },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`${label}: HTTP ${res.status}`); // cliente: não adianta retentar
      }
      if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`); // 5xx: cai no catch e retenta
      return await res.text();
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (/HTTP 4\d\d/.test(msg)) throw e; // 4xx não é transitório
      if (attempt < retries) await sleep(backoffMs * (attempt + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`${label}: ${String(lastErr)}`);
}
