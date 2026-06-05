/**
 * Normaliza o texto cru de localização de uma vaga em UF/cidade/remote.
 * Fail-safe: na dúvida (estrangeiro, ambíguo, só país) → uf null. NUNCA atribui
 * uma UF errada — melhor "unknown" do que classificar o Rio como São Paulo.
 *
 * A normalização (sem acento, minúscula) serve só para a CHAVE de lookup; a
 * cidade é devolvida com a grafia/acentuação original.
 */
export interface NormalizedLocation {
  uf: string | null;
  city: string | null;
  remote: boolean;
}

const UF_SIGLAS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

const ESTADO_NOME: Record<string, string> = {
  acre: "AC", alagoas: "AL", amapa: "AP", amazonas: "AM", bahia: "BA",
  ceara: "CE", "distrito federal": "DF", "espirito santo": "ES", goias: "GO",
  maranhao: "MA", "mato grosso": "MT", "mato grosso do sul": "MS",
  "minas gerais": "MG", para: "PA", paraiba: "PB", parana: "PR",
  pernambuco: "PE", piaui: "PI", "rio de janeiro": "RJ",
  "rio grande do norte": "RN", "rio grande do sul": "RS", rondonia: "RO",
  roraima: "RR", "santa catarina": "SC", "sao paulo": "SP", sergipe: "SE",
  tocantins: "TO",
};

const CAPITAL: Record<string, string> = {
  "rio branco": "AC", maceio: "AL", macapa: "AP", manaus: "AM", salvador: "BA",
  fortaleza: "CE", brasilia: "DF", vitoria: "ES", goiania: "GO",
  "sao luis": "MA", cuiaba: "MT", "campo grande": "MS", "belo horizonte": "MG",
  belem: "PA", "joao pessoa": "PB", curitiba: "PR", recife: "PE",
  teresina: "PI", "rio de janeiro": "RJ", natal: "RN", "porto alegre": "RS",
  "porto velho": "RO", "boa vista": "RR", florianopolis: "SC",
  "sao paulo": "SP", aracaju: "SE", palmas: "TO",
};

const REMOTE_RE = /remot|home.?office|anywhere|teletrabalho|dist[âa]ncia/i;

const norm = (s: string): string =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Mais específico primeiro ("mato grosso do sul" antes de "mato grosso"),
// para o substring mais curto não vencer o mais preciso.
const byLenDesc = (a: [string, string], b: [string, string]) => b[0].length - a[0].length;
const ESTADO_ENTRIES = Object.entries(ESTADO_NOME).sort(byLenDesc);
const CAPITAL_ENTRIES = Object.entries(CAPITAL).sort(byLenDesc);
const wholeWord = (needle: string, haystack: string) =>
  new RegExp(`\\b${needle}\\b`).test(haystack);

function detectUf(raw: string): string | null {
  // 1. Sigla UF explícita (\bXX\b válida).
  const siglas = raw.toUpperCase().match(/\b[A-Z]{2}\b/g) ?? [];
  const sigla = siglas.find((s) => UF_SIGLAS.has(s));
  if (sigla) return sigla;

  // 2. Nome de estado por extenso, depois capital — palavra inteira, sem acento,
  // para "para" (PA) não casar dentro de "parana" (PR).
  const n = norm(raw);
  for (const [nome, uf] of ESTADO_ENTRIES) if (wholeWord(nome, n)) return uf;
  for (const [cap, uf] of CAPITAL_ENTRIES) if (wholeWord(cap, n)) return uf;
  return null;
}

function detectCity(raw: string): string | null {
  const first = raw.split(/[,\-–]|\(/)[0].trim();
  if (!first || REMOTE_RE.test(first)) return null;
  // Descarta se a "cidade" for na verdade só uma sigla UF.
  if (UF_SIGLAS.has(first.toUpperCase())) return null;
  return first;
}

export function normalizeLocation(raw: string | null | undefined): NormalizedLocation {
  if (!raw || !raw.trim()) return { uf: null, city: null, remote: false };
  const uf = detectUf(raw);
  return {
    uf,
    city: detectCity(raw),
    remote: REMOTE_RE.test(raw),
  };
}
