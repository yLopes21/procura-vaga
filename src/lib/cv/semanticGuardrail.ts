/**
 * Guardrail semântico do currículo adaptado: garante que a versão gerada pela IA
 * NÃO infla responsabilidade nem inventa fatos. Bloqueia:
 *  - verbo de apoio promovido a verbo de liderança (auxiliei → liderei);
 *  - número/quantidade presente no texto adaptado e ausente do original.
 *
 * É uma rede de segurança de ÚLTIMA linha — roda depois da geração e veta o que
 * cruza a fronteira da verdade. Falso-positivo (vetar reescrita honesta) é
 * preferível a falso-negativo (deixar passar exagero).
 */
export type GuardrailViolationType = "verbo_inflado" | "numero_inventado";

export interface GuardrailViolation {
  type: GuardrailViolationType;
  detail: string;
}

/** Verbos que afirmam protagonismo/comando — proibidos se não estavam no original. */
const LEADERSHIP = [
  "liderei", "liderou", "liderança", "gerenciei", "gerenciou", "dirigi",
  "comandei", "chefiei", "fundei", "criei sozinho", "responsavel unico",
];

const norm = (s: string): string =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Extrai os grupos de dígitos do texto (ignora pontuação de milhar/decimal). */
function extractNumbers(text: string): string[] {
  return (text.match(/\d+/g) ?? []).map((n) => String(Number(n)));
}

export function checkSemanticGuardrail(original: string, adapted: string): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  const o = norm(original);
  const a = norm(adapted);

  // 1. Verbo de liderança presente no adaptado mas ausente do original.
  for (const verb of LEADERSHIP) {
    if (a.includes(verb) && !o.includes(verb)) {
      violations.push({ type: "verbo_inflado", detail: `"${verb}" não constava no original` });
    }
  }

  // 2. Número presente no adaptado e ausente do original (fato inventado).
  const originalNumbers = new Set(extractNumbers(original));
  for (const n of extractNumbers(adapted)) {
    if (!originalNumbers.has(n)) {
      violations.push({ type: "numero_inventado", detail: `número "${n}" não constava no original` });
    }
  }

  return violations;
}
