/**
 * Classificação de tipo de vínculo e senioridade a partir do título da vaga.
 * Fail-safe: na dúvida ou em conflito de sinais → "unknown" (nunca rotula
 * estágio como efetivo, nem vice-versa).
 */

export type EmploymentType = "estagio" | "trainee" | "efetivo" | "unknown";
export type Seniority = "junior" | "pleno" | "senior" | "unknown";

const ESTAGIO = /est[áa]gi|\bintern(ship)?\b/i;
const TRAINEE = /\btrainee\b|jovem aprendiz|\baprendiz\b/i;
/** Termos de vínculo que sinalizam POSITIVAMENTE uma vaga efetiva. */
const EFETIVO = /\befetiv|\bclt\b|full[-\s]?time|tempo integral|contrata[çc][ãa]o direta/i;

export function classifyEmploymentType(title: string): EmploymentType {
  const t = title.trim();
  if (!t) return "unknown";

  const isEstagio = ESTAGIO.test(t);
  const isTrainee = TRAINEE.test(t);

  // Sinais conflitantes → não arrisca rótulo.
  if (isEstagio && isTrainee) return "unknown";
  if (isEstagio) return "estagio";
  if (isTrainee) return "trainee";

  // PM-02: sem marcador de estágio/trainee, só afirma "efetivo" com sinal
  // POSITIVO — termo de vínculo OU senioridade detectável (júnior/pleno/sênior/
  // gerente/lead). Sem sinal (ex.: "Programa de Talentos") → "unknown", para
  // NUNCA rotular um estágio disfarçado como efetivo.
  if (EFETIVO.test(t) || classifySeniority(t) !== "unknown") return "efetivo";
  return "unknown";
}

const SENIOR = /s[êe]nior|\bsr\b|especialista|principal|\bstaff\b|\blead\b|l[íi]der|gerente|head\b/i;
const JUNIOR = /j[úu]nior|\bjr\b/i;
const PLENO = /\bpleno\b|\bpl\b|mid[-\s]?level/i;

export function classifySeniority(title: string): Seniority {
  const t = title.trim();
  if (!t) return "unknown";
  // Ordem: sênior tem precedência sobre júnior/pleno em títulos compostos.
  if (SENIOR.test(t)) return "senior";
  if (JUNIOR.test(t)) return "junior";
  if (PLENO.test(t)) return "pleno";
  return "unknown";
}
