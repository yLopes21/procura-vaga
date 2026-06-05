import taxonomyData from "../../../data/taxonomy-top20.json";

interface CourseEntry {
  label: string;
  cineArea: string;
  keywords: string[];
  subareas: Record<string, string[]>;
}

const taxonomy = taxonomyData as Record<string, CourseEntry>;

export interface Option {
  value: string;
  label: string;
}

/** Cursos para o select (na ordem do JSON canônico). */
export const COURSES: Option[] = Object.entries(taxonomy).map(([value, e]) => ({
  value,
  label: e.label,
}));

/** Label legível das subáreas (chave técnica → PT-BR). Fallback: a própria chave. */
const SUBAREA_LABEL: Record<string, string> = {
  financeiro: "Financeiro",
  marketing: "Marketing",
  rh: "Recursos Humanos",
  comercial: "Comercial",
  operacoes: "Operações",
};

/** Áreas (subáreas) de um curso, para o seletor DEPENDENTE. Vazio se o curso não tem. */
export function subareaOptions(course: string): Option[] {
  const entry = taxonomy[course];
  if (!entry) return [];
  return Object.keys(entry.subareas).map((value) => ({
    value,
    label: SUBAREA_LABEL[value] ?? value,
  }));
}

/** Conjunto de valores válidos (para validação no parse dos filtros). */
export const COURSE_VALUES = new Set(COURSES.map((c) => c.value));
