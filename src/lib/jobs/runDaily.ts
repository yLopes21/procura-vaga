/**
 * Coleta diária do catálogo, como MÓDULO importável (script `pnpm scrape` e o
 * endpoint do Vercel Cron chamam `runDailyCollect`). Espelha o padrão de
 * `notify/sendDigest.ts`: a lógica vive aqui; `scripts/daily.ts` é só um shim.
 *
 * NÃO chama `process.exit` (rodaria dentro de uma Function serverless) e RETORNA
 * o resumo em vez de só logar. Fluxo idempotente: upsert preserva status/validação
 * e o fechamento por idade tem circuit-breaker contra coleta parcial (PM-08).
 */
import { sql, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import type { NewJob } from "@/lib/db/schema";
import type { JobSource } from "@/lib/sources/types";
import { greenhouse } from "@/lib/sources/greenhouse";
import { lever } from "@/lib/sources/lever";
import { ashby } from "@/lib/sources/ashby";
import { workable } from "@/lib/sources/workable";
import { fetchGupyJobs } from "@/lib/sources/gupy";
import { fetchVagasJobs } from "@/lib/sources/vagas";
import { fetchInfojobsJobs } from "@/lib/sources/infojobs";
import { fetchJoobleJobs } from "@/lib/sources/jooble";
import { fetchJsearchJobs } from "@/lib/sources/jsearch";
import { fetchAdzunaJobs } from "@/lib/sources/adzuna";
import { collectQuerySource, dedupRaws, type QuerySource, type CollectAcc } from "@/lib/sources/collect";
import { toNewJob } from "@/lib/jobs/toNewJob";
import { staleJobIds, shouldAbortClosing, collectionLooksBroken } from "@/lib/freshness/listingDiff";
import watchlist from "../../../data/companies-watchlist.json";

const ATS: Record<string, JobSource> = { greenhouse, lever, ashby, workable };
/** Scrapers de HTML público (portais de busca BR), chamados por TERMO como o Gupy. */
const SCRAPERS: Record<string, QuerySource> = {
  vagas: fetchVagasJobs,
  infojobs: fetchInfojobsJobs,
};
/** Agregadores via API (KEY-DEP): sem a chave, o kill-switch pula a fonte com 1 aviso. */
const AGGREGATORS: Record<string, QuerySource> = {
  jooble: fetchJoobleJobs,
  jsearch: fetchJsearchJobs,
  adzuna: fetchAdzunaJobs,
};
const STALE_DAYS = 7;
const CHUNK = 100;

export interface DailyResult {
  perSource: Record<string, number>;
  collected: number;
  unique: number;
  upserted: number;
  closed: number;
  errors: string[];
}

async function collectAll(): Promise<CollectAcc> {
  const raws: CollectAcc["raws"] = [];
  const errors: string[] = [];
  // Zero-init: o log distingue "fonte tentada, watchlist vazio" de "fonte ausente".
  const perSource: Record<string, number> = Object.fromEntries(
    [...Object.keys(ATS), "gupy", ...Object.keys(SCRAPERS), ...Object.keys(AGGREGATORS)].map((k) => [k, 0]),
  );
  const acc: CollectAcc = { raws, errors, perSource };

  for (const [name, source] of Object.entries(ATS)) {
    const entry = (watchlist as Record<string, unknown>)[name];
    if (!Array.isArray(entry)) {
      if (entry !== undefined) errors.push(`${name}: entrada no watchlist não é lista — ignorada`);
      continue;
    }
    for (const board of entry as string[]) {
      try {
        const jobsFromBoard = await source.fetchJobs(board);
        raws.push(...jobsFromBoard);
        perSource[name] = (perSource[name] ?? 0) + jobsFromBoard.length;
      } catch (e) {
        errors.push(`${name}:${board} — ${(e as Error).message}`);
      }
    }
  }

  for (const query of watchlist.gupyQueries) {
    try {
      const jobsFromQuery = await fetchGupyJobs(query, { limit: 50 });
      raws.push(...jobsFromQuery);
      perSource.gupy = (perSource.gupy ?? 0) + jobsFromQuery.length;
    } catch (e) {
      errors.push(`gupy:"${query}" — ${(e as Error).message}`);
    }
  }

  // Scrapers BR (HTML público) + agregadores via API (KEY-DEP), por TERMO com
  // kill-switch por fonte. Fontes sem chave lançam na 1ª query e são puladas com 1 aviso.
  for (const [name, fetchFn] of Object.entries(SCRAPERS)) {
    await collectQuerySource(name, fetchFn, watchlist.scrapeQueries, acc);
  }
  for (const [name, fetchFn] of Object.entries(AGGREGATORS)) {
    await collectQuerySource(name, fetchFn, watchlist.scrapeQueries, acc);
  }

  return acc;
}

async function upsertJobs(db: ReturnType<typeof getDb>, newJobs: NewJob[]): Promise<number> {
  for (let i = 0; i < newJobs.length; i += CHUNK) {
    const batch = newJobs.slice(i, i + CHUNK);
    await db
      .insert(jobs)
      .values(batch)
      .onConflictDoUpdate({
        target: [jobs.source, jobs.sourceJobId],
        set: {
          lastSeenAt: sql`now()`,
          title: sql`excluded.title`,
          titleNorm: sql`excluded.title_norm`,
          applyUrl: sql`excluded.apply_url`,
          company: sql`excluded.company`,
          locationUf: sql`excluded.location_uf`,
          locationCity: sql`excluded.location_city`,
          remoteFlag: sql`excluded.remote_flag`,
          employmentType: sql`excluded.employment_type`,
          seniority: sql`excluded.seniority`,
          confidence: sql`excluded.confidence`,
          dedupClusterId: sql`excluded.dedup_cluster_id`,
          // PRESERVADOS de propósito: status, last_validated_at, closed_at, collected_at.
        },
      });
  }
  return newJobs.length;
}

async function closeStale(db: ReturnType<typeof getDb>): Promise<number> {
  const active = await db
    .select({ id: jobs.id, status: jobs.status, lastSeenAt: jobs.lastSeenAt })
    .from(jobs)
    .where(eq(jobs.status, "active"));
  const stale = staleJobIds(active, new Date(), STALE_DAYS);
  if (stale.length === 0) return 0;
  if (shouldAbortClosing(stale.length, active.length)) {
    console.warn(
      `[circuit-breaker] fecharia ${stale.length}/${active.length} vagas — abortado (provável falha de coleta).`,
    );
    return 0;
  }
  await db.update(jobs).set({ status: "closed", closedAt: sql`now()` }).where(inArray(jobs.id, stale));
  return stale.length;
}

/** Roda a coleta diária completa e retorna o resumo. Sem process.exit (serverless-safe). */
export async function runDailyCollect(): Promise<DailyResult> {
  const db = getDb();
  const { raws, errors, perSource } = await collectAll();
  const deduped = dedupRaws(raws);
  const upserted = deduped.length ? await upsertJobs(db, deduped.map(toNewJob)) : 0;

  // P1: coleta vazia (provável falha de rede) NÃO pode fechar vagas válidas em silêncio.
  let closed = 0;
  if (collectionLooksBroken(deduped.length)) {
    console.warn("[close-stale] pulado — coleta retornou 0 vagas (provável falha de rede); nenhuma vaga fechada.");
  } else {
    closed = await closeStale(db);
  }

  console.log("=== Coleta diária ===");
  console.log("Por fonte:", perSource);
  console.log(`Coletadas: ${raws.length} · únicas: ${deduped.length} · upsert(tentativas): ${upserted} · fechadas: ${closed}`);
  if (errors.length) console.warn(`Erros (${errors.length}):`, errors);

  return { perSource, collected: raws.length, unique: deduped.length, upserted, closed, errors };
}
