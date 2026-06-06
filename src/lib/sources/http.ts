/**
 * UA de browser real usado pelos scrapers de HTML público (Vagas.com, InfoJobs).
 * Esses sites respondem 200 com um UA de navegador e bloqueiam clientes "headless"
 * óbvios. Ponto único para atualizar caso algum endpoint passe a exigir outro.
 */
export const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** Timeout de scraping (ms) — páginas HTML completas são maiores que JSON de API. */
export const SCRAPE_TIMEOUT_MS = 20_000;
/** Timeout de API JSON (ms) — menor; com 4 tentativas, mantém o pior caso por fonte sob o teto do cron. */
export const API_TIMEOUT_MS = 10_000;

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
 * fetch com **retry e backoff**, retornando a Response (ok). Núcleo compartilhado
 * por `fetchHtmlWithRetry` (scrapers) e `fetchJsonWithRetry` (APIs agregadoras).
 *
 * Motivação (verificado ao vivo): o handshake inicial com vários hosts (InfoJobs,
 * Jooble, ATS) estoura o connectTimeout do undici de forma transitória
 * (`UND_ERR_CONNECT_TIMEOUT` / `ECONNRESET`); a tentativa seguinte quase sempre
 * conecta. Erros de rede e HTTP 5xx são retentados; HTTP 4xx (erro do cliente,
 * ex.: 403 "not subscribed") falha na hora. Lança o último erro se esgotar.
 */
async function retryingFetch(
  url: string | URL,
  init: RequestInit,
  label: string,
  opts: FetchHtmlOptions,
): Promise<Response> {
  const { retries = 2, backoffMs = 800, timeoutMs = SCRAPE_TIMEOUT_MS } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`); // 4xx e 5xx caem aqui
      return res;
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (/HTTP 4\d\d/.test(msg)) throw e; // 4xx não é transitório (msg = "label: HTTP 4xx", sem segredo)
      if (attempt < retries) await sleep(backoffMs * (attempt + 1));
    }
  }
  // Esgotou: normaliza para "label: <code|msg>". NÃO propaga o objeto de rede do
  // undici — seu `.cause` carrega a URL, que pode conter a chave da API (Jooble no
  // path, Adzuna na query). Só o código curto (ex.: UND_ERR_CONNECT_TIMEOUT) vaza.
  const cause = (lastErr as { cause?: { code?: string } } | undefined)?.cause?.code;
  const detail = cause ?? (lastErr instanceof Error ? lastErr.message : String(lastErr));
  throw new Error(`${label}: ${detail}`);
}

/** GET de uma página HTML com User-Agent de browser e retry. */
export async function fetchHtmlWithRetry(
  url: string | URL,
  label: string,
  opts: FetchHtmlOptions = {},
): Promise<string> {
  const res = await retryingFetch(url, { headers: { "User-Agent": BROWSER_UA } }, label, opts);
  return res.text();
}

/** fetch de uma API JSON com retry. `init` define method/headers/body (POST do Jooble etc.). */
export async function fetchJsonWithRetry<T = unknown>(
  url: string | URL,
  label: string,
  init: RequestInit = {},
  opts: FetchHtmlOptions = {},
): Promise<T> {
  const res = await retryingFetch(url, init, label, { timeoutMs: API_TIMEOUT_MS, ...opts });
  return (await res.json()) as T;
}
