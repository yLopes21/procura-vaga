"use client";

import { useState } from "react";
import { COURSES, subareaOptions } from "@/lib/taxonomy/courseOptions";
import type { JobFilters } from "@/lib/jobs/searchJobs";

const UFS = ["SP","RJ","MG","RS","PR","SC","BA","PE","CE","GO","DF","ES","PA","AM","MT","MS","PB","RN","AL","PI","MA","SE","RO","TO","AC","AP","RR"];
const TYPES: { v: string; l: string }[] = [
  { v: "estagio", l: "Estágio" },
  { v: "trainee", l: "Trainee" },
  { v: "efetivo", l: "Efetivo" },
];

const selectCls =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus-visible:border-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

const chipSpan =
  "cursor-pointer select-none rounded-full border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition peer-checked:border-zinc-900 peer-checked:bg-zinc-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-900/30 dark:border-zinc-700 dark:text-zinc-300 dark:peer-checked:border-white dark:peer-checked:bg-white dark:peer-checked:text-zinc-900";

/** Chip não-controlado (Tipo/remoto) — não dependem do curso. */
function Chip({ name, value, label, defaultChecked }: { name: string; value: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="inline-flex">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className={chipSpan}>{label}</span>
    </label>
  );
}

export function SearchForm({ defaults }: { defaults: JobFilters }) {
  const [course, setCourse] = useState(defaults.course ?? "");
  // Controlado: trocar de curso zera as áreas (evita herdar seleção de outro curso).
  const [checkedAreas, setCheckedAreas] = useState<string[]>(defaults.subareas);

  const areas = course ? subareaOptions(course) : [];
  const courseLabel = COURSES.find((c) => c.value === course)?.label;
  const selectedTypes = new Set(defaults.types as string[]);

  function handleCourse(value: string) {
    setCourse(value);
    setCheckedAreas([]);
  }
  function toggleArea(value: string) {
    setCheckedAreas((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  return (
    <form method="get" className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem]">
        <div>
          <label htmlFor="curso" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Curso</label>
          <select id="curso" name="curso" value={course} onChange={(e) => handleCourse(e.target.value)} className={selectCls}>
            <option value="">Selecione um curso…</option>
            {COURSES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="uf" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Estado</label>
          <select id="uf" name="uf" defaultValue={defaults.uf ?? ""} className={selectCls}>
            <option value="">Todos</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>
      </div>

      {areas.length > 0 && (
        <fieldset className="mt-3">
          <legend className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">Área de {courseLabel}</legend>
          <div className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <label key={a.value} className="inline-flex">
                <input
                  type="checkbox"
                  name="area"
                  value={a.value}
                  checked={checkedAreas.includes(a.value)}
                  onChange={() => toggleArea(a.value)}
                  className="peer sr-only"
                />
                <span className={chipSpan}>{a.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="mt-3">
        <legend className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">Tipo</legend>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <Chip key={t.v} name="tipo" value={t.v} label={t.l} defaultChecked={selectedTypes.has(t.v)} />
          ))}
          <Chip name="remoto" value="1" label="Incluir remotas" defaultChecked={defaults.includeRemote} />
        </div>
      </fieldset>

      <div className="mt-4 flex justify-end">
        <button type="submit" className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-900">
          Buscar
        </button>
      </div>
    </form>
  );
}
