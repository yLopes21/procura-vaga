import { getDb } from "@/lib/db";
import { parseJobFilters, searchJobs } from "@/lib/jobs/searchJobs";
import { SearchForm } from "@/components/search-form";
import { JobCard } from "@/components/job-card";
import type { Job } from "@/lib/db/schema";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = parseJobFilters(params);

  let results: Job[] = [];
  let failed = false;
  try {
    results = await searchJobs(getDb(), filters);
  } catch (err) {
    console.error("[home] busca falhou", { filters, err });
    failed = true;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Procura-Vaga</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Vagas abertas no Brasil — filtre por curso, área, local e tipo.
        </p>
      </header>

      <SearchForm defaults={filters} />

      <section className="mt-6">
        {failed ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/40">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Não foi possível carregar as vagas agora.</p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">Atualize a página em alguns instantes.</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400" aria-live="polite">
              {results.length} {results.length === 1 ? "vaga encontrada" : "vagas encontradas"}
            </p>
            {results.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nenhuma vaga com esses filtros.</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Tente outro curso/área, trocar o estado ou incluir remotas.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {results.map((job) => (
                  <li key={job.id}>
                    <JobCard job={job} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </main>
  );
}
