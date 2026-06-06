/**
 * Montagem do e-mail de digest diário (parte PURA, testável sem rede nem banco).
 * Recebe as vagas novas já selecionadas e devolve assunto + HTML, ou null se não
 * há nada a enviar (não disparamos e-mail vazio). Os campos vêm de fontes externas
 * (scraping/agregadores), então todo texto dinâmico é escapado (anti-injeção).
 */
import type { Job } from "@/lib/db/schema";

export type DigestJob = Pick<
  Job,
  "title" | "company" | "applyUrl" | "locationUf" | "locationCity" | "remoteFlag" | "employmentType"
>;

const MAX_JOBS = 50;
const TYPE_LABEL: Record<string, string> = { estagio: "Estágio", trainee: "Trainee", efetivo: "Efetivo" };

/** Conversão de Job (linha do banco) para o subconjunto usado no digest. */
export function toDigestJob(j: Job): DigestJob {
  return {
    title: j.title,
    company: j.company,
    applyUrl: j.applyUrl,
    locationUf: j.locationUf,
    locationCity: j.locationCity,
    remoteFlag: j.remoteFlag,
    employmentType: j.employmentType,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Só http/https vira link clicável; qualquer outro protocolo (javascript:, data:) → "#". */
function safeLinkUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.protocol === "http:" || u.protocol === "https:") return raw;
  } catch {
    /* URL inválida → cai no fallback */
  }
  return "#";
}

function formatLocation(j: DigestJob): string {
  if (j.remoteFlag) return "Remoto";
  const parts = [j.locationCity, j.locationUf].filter((p): p is string => !!p && p.trim().length > 0);
  return parts.length ? parts.join(" - ") : "Local não informado";
}

function jobCard(j: DigestJob): string {
  const label = TYPE_LABEL[j.employmentType];
  const badge = label
    ? `<span style="display:inline-block;background:#f4f4f5;color:#52525b;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600;margin-left:8px">${escapeHtml(label)}</span>`
    : "";
  return `<div class="vaga-card" style="border:1px solid #e4e4e7;border-radius:10px;padding:14px 16px;margin:0 0 10px">
    <a href="${escapeHtml(safeLinkUrl(j.applyUrl))}" style="font-size:15px;font-weight:600;color:#18181b;text-decoration:none">${escapeHtml(j.title)}</a>${badge}
    <div style="font-size:13px;color:#52525b;margin-top:4px">${escapeHtml(j.company)} · ${escapeHtml(formatLocation(j))}</div>
  </div>`;
}

/** Monta o digest. Retorna null se não há vagas (não envia e-mail vazio). */
export function buildDigest(jobs: DigestJob[]): { subject: string; html: string } | null {
  if (jobs.length === 0) return null;
  const shown = jobs.slice(0, MAX_JOBS);
  const overflow = jobs.length - shown.length;
  const plural = jobs.length > 1 ? "s" : "";
  const subject = `${jobs.length} nova${plural} vaga${plural} — Procura-Vaga`;
  const overflowNote =
    overflow > 0
      ? `<p style="font-size:13px;color:#71717a;margin:16px 0 0">e mais ${overflow} vaga${overflow > 1 ? "s" : ""} — abra o app para ver todas.</p>`
      : "";
  const html = `<!doctype html><html lang="pt-BR"><body style="font-family:system-ui,-apple-system,sans-serif;background:#fafafa;padding:24px;color:#18181b">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:28px">
    <h1 style="font-size:18px;margin:0 0 4px">${escapeHtml(subject)}</h1>
    <p style="font-size:13px;color:#71717a;margin:0 0 20px">Vagas novas que combinam com seu perfil, validadas no clique.</p>
    ${shown.map(jobCard).join("")}
    ${overflowNote}
    <p style="font-size:12px;color:#a1a1aa;margin:24px 0 0">Procura-Vaga · coleta diária automática.</p>
  </div></body></html>`;
  return { subject, html };
}
