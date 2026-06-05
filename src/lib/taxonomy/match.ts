import taxonomyData from "../../../data/taxonomy-top20.json";
import { norm } from "@/lib/utils/norm";

/**
 * Taxonomia curso → área CINE → keywords (+ subáreas), usada para casar o perfil
 * do Rodrigo (curso + sub-área) com o título da vaga. Comparação sem acento e
 * sem caixa, para "Administração" casar a keyword "administra".
 */
interface CourseEntry {
  label: string;
  cineArea: string;
  keywords: string[];
  subareas: Record<string, string[]>;
}

const taxonomy = taxonomyData as Record<string, CourseEntry>;

export interface ProfileMatch {
  course: string;
  subarea?: string;
}

export function cineAreaFor(course: string): string | null {
  return taxonomy[course]?.cineArea ?? null;
}

/** Keywords do curso + (se informada) da sub-área. Vazio se o curso não existe. */
export function keywordsFor(course: string, subarea?: string): string[] {
  const entry = taxonomy[course];
  if (!entry) return [];
  const sub = subarea ? (entry.subareas[subarea] ?? []) : [];
  return [...entry.keywords, ...sub];
}

/**
 * Keywords para a busca por curso + N áreas (seletor dependente da UI):
 * - sem áreas → keywords gerais do curso (amplo);
 * - com áreas → união das keywords das áreas selecionadas (específico).
 * Vazio se o curso não existe.
 */
export function keywordsForAreas(course: string, areas: string[]): string[] {
  const entry = taxonomy[course];
  if (!entry) return [];
  if (areas.length === 0) return entry.keywords;
  return areas.flatMap((a) => entry.subareas[a] ?? []);
}

/** O título da vaga casa o perfil se contém alguma keyword (curso ou sub-área). */
export function titleMatchesProfile(title: string, profile: ProfileMatch): boolean {
  const kws = keywordsFor(profile.course, profile.subarea);
  if (kws.length === 0) return false;
  const t = norm(title);
  return kws.some((kw) => t.includes(norm(kw)));
}
