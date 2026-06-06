"use client";

import { useState } from "react";
import type { Job } from "@/lib/db/schema";

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  estagio: { label: "Estágio", cls: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950 dark:text-blue-300" },
  trainee: { label: "Trainee", cls: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950 dark:text-violet-300" },
  efetivo: { label: "Efetivo", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300" },
  unknown: { label: "Tipo a confirmar", cls: "bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400" },
};

function localLabel(job: Job): string {
  if (job.remoteFlag) return "Remoto";
  if (job.locationCity && job.locationUf) return `${job.locationCity}, ${job.locationUf}`;
  if (job.locationUf) return job.locationUf;
  return "Local a confirmar";
}

function openJob(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function JobCard({ job }: { job: Job }) {
  const badge = TYPE_BADGE[job.employmentType] ?? TYPE_BADGE.unknown;
  const [state, setState] = useState<"idle" | "checking" | "closed">("idle");

  /** Valida no clique: só abre se a vaga não estiver fechada (fail-open em erro de rede). */
  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (state !== "idle") return;
    setState("checking");
    try {
      const res = await fetch(`/api/jobs/${job.id}/validate`, { method: "POST" });
      const data = (await res.json()) as { status?: string };
      if (data.status === "closed") {
        setState("closed");
        return;
      }
      openJob(job.applyUrl);
      setState("idle");
    } catch {
      openJob(job.applyUrl); // erro de validação não bloqueia o acesso
      setState("idle");
    }
  }

  if (state === "closed") {
    return (
      <div className="block rounded-xl border border-zinc-200 bg-zinc-50 p-4 opacity-70 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">{job.company}</p>
            <h2 className="mt-0.5 truncate text-sm font-semibold text-zinc-500 line-through dark:text-zinc-500">{job.title}</h2>
          </div>
          <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-950 dark:text-red-300">
            Vaga encerrada
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">Conferida agora — não está mais aberta.</p>
      </div>
    );
  }

  return (
    <a
      href={job.applyUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-busy={state === "checking"}
      className="group block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:focus-visible:ring-zinc-100"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">{job.company}</p>
          <h2 className="mt-0.5 truncate text-sm font-semibold text-zinc-900 group-hover:underline dark:text-zinc-100">
            {job.title}
          </h2>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        {localLabel(job)} <span aria-hidden>·</span> <span className="capitalize">{job.source}</span>
        {state === "checking" && <span className="ml-2 italic">conferindo se está aberta…</span>}
      </div>
    </a>
  );
}
