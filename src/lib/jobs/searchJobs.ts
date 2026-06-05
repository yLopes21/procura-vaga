import { and, or, eq, inArray, ilike, desc, type SQL } from "drizzle-orm";
import type { getDb } from "@/lib/db";
import { jobs, type Job } from "@/lib/db/schema";
import { keywordsForAreas } from "@/lib/taxonomy/match";
import { COURSE_VALUES, subareaOptions } from "@/lib/taxonomy/courseOptions";
import { norm } from "@/lib/utils/norm";

const VALID_TYPES = ["estagio", "trainee", "efetivo"] as const;
export type EmploymentType = (typeof VALID_TYPES)[number];

export interface JobFilters {
  course: string | null;
  subareas: string[];
  uf: string | null;
  includeRemote: boolean;
  types: EmploymentType[];
}

type ParamValue = string | string[] | undefined;
type Params = Record<string, ParamValue>;

const first = (v: ParamValue): string => (Array.isArray(v) ? (v[0] ?? "") : (v ?? ""));
const asList = (v: ParamValue): string[] =>
  (Array.isArray(v) ? v : (v ?? "").split(",")).map((s) => s.trim()).filter(Boolean);

/** Normaliza searchParams em filtros validados — fail-safe: valor inválido é ignorado.
 *  Áreas só valem quando há curso E são subáreas existentes daquele curso (validadas aqui). */
export function parseJobFilters(params: Params): JobFilters {
  const courseRaw = first(params.curso).trim().toLowerCase();
  const course = COURSE_VALUES.has(courseRaw) ? courseRaw : null;

  const validSubs = course ? new Set(subareaOptions(course).map((o) => o.value)) : null;
  const subareas = validSubs
    ? asList(params.area).map((a) => a.toLowerCase()).filter((a) => validSubs.has(a))
    : [];

  const ufRaw = first(params.uf).trim().toUpperCase();
  const uf = /^[A-Z]{2}$/.test(ufRaw) ? ufRaw : null;

  const types = asList(params.tipo)
    .map((t) => t.toLowerCase())
    .filter((t): t is EmploymentType => (VALID_TYPES as readonly string[]).includes(t));

  const remoto = first(params.remoto);
  const includeRemote = remoto === "1" || remoto === "true";

  return { course, subareas, uf, includeRemote, types };
}

/** Monta as condições WHERE (só vagas ativas; curso→keywords, local estrito + remoto opcional). */
export function buildSearchConditions(filters: JobFilters): SQL[] {
  const conds: SQL[] = [eq(jobs.status, "active")];

  if (filters.uf) {
    if (filters.includeRemote) {
      const localOrRemote = or(eq(jobs.locationUf, filters.uf), eq(jobs.remoteFlag, true));
      if (localOrRemote) conds.push(localOrRemote);
    } else {
      conds.push(eq(jobs.locationUf, filters.uf));
    }
  } else if (filters.includeRemote) {
    conds.push(eq(jobs.remoteFlag, true));
  }

  if (filters.types.length > 0) {
    conds.push(inArray(jobs.employmentType, filters.types));
  }

  if (filters.course) {
    // keywordsForAreas nunca é vazio quando o curso existe (cai nas keywords gerais do curso).
    const keywords = keywordsForAreas(filters.course, filters.subareas);
    const anyKeyword = or(...keywords.map((kw) => ilike(jobs.titleNorm, `%${norm(kw)}%`)));
    if (anyKeyword) conds.push(anyKeyword);
  }

  return conds;
}

/** Executa a busca no catálogo (mais recentes primeiro, limitada). */
export async function searchJobs(
  db: ReturnType<typeof getDb>,
  filters: JobFilters,
  limit = 50,
): Promise<Job[]> {
  return db
    .select()
    .from(jobs)
    .where(and(...buildSearchConditions(filters)))
    .orderBy(desc(jobs.collectedAt))
    .limit(limit);
}
