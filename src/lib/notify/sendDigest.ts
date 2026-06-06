/**
 * Orquestração do digest diário (parte com I/O: banco + Resend).
 * Seleciona vagas active ainda não notificadas ao dono, monta o e-mail (buildDigest)
 * e envia — `EMAIL_TRANSPORT=console` loga em dev; `resend` envia de verdade (cron).
 * Marca as enviadas em seen_jobs para não repetir. Idempotente: re-rodar no mesmo
 * dia sem vagas novas não envia nada.
 */
import { and, eq, desc, notInArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { jobs as jobsTable, seenJobs, users } from "@/lib/db/schema";
import type { Job } from "@/lib/db/schema";
import { env, requireEnv } from "@/lib/env";
import { buildDigest, toDigestJob } from "./digest";

const DIGEST_LIMIT = 50;

/** Vagas active que o usuário ainda não viu no digest (subquery evita trazer IDs ao JS). */
export async function selectNewJobs(
  db: ReturnType<typeof getDb>,
  userId: string,
  limit = DIGEST_LIMIT,
): Promise<Job[]> {
  const alreadySeen = db.select({ id: seenJobs.jobId }).from(seenJobs).where(eq(seenJobs.userId, userId));
  return db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.status, "active"), notInArray(jobsTable.id, alreadySeen)))
    .orderBy(desc(jobsTable.collectedAt))
    .limit(limit);
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (env.EMAIL_TRANSPORT === "console") {
    if (env.NODE_ENV === "production") {
      throw new Error("EMAIL_TRANSPORT=console proibido em produção (fail-closed).");
    }
    // Não loga o endereço (PII); só o suficiente para conferir a geração.
    console.log(`\n📧 [digest console] Assunto: ${subject} · HTML: ${html.length} chars\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${requireEnv("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend digest falhou (HTTP ${res.status})`);
}

/** Roda o digest para o dono (e-mail do allowlist). Retorna o que foi feito. */
export async function runDigest(): Promise<{ sent: boolean; count: number }> {
  const db = getDb();
  const email = requireEnv("ALLOWED_EMAIL");
  // lower() nos dois lados: o seed grava e-mail minúsculo; sem normalizar aqui,
  // um ALLOWED_EMAIL com maiúscula não acharia o user e o digest sairia vazio.
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
    .limit(1);
  if (!user) {
    console.warn("[digest] nenhum usuário no banco — faça login uma vez antes do 1º digest.");
    return { sent: false, count: 0 };
  }
  const newJobs = await selectNewJobs(db, user.id);
  const digest = buildDigest(newJobs.map(toDigestJob));
  if (!digest) {
    console.log("[digest] 0 vagas novas — nada a enviar.");
    return { sent: false, count: 0 };
  }
  await sendEmail(email, digest.subject, digest.html);
  // Só marca como vista no envio REAL — o modo console é preview e não deve
  // "consumir" vagas (senão elas somem do primeiro digest de verdade).
  const realSend = env.EMAIL_TRANSPORT === "resend";
  if (realSend) {
    await db
      .insert(seenJobs)
      .values(newJobs.map((j) => ({ userId: user.id, jobId: j.id })))
      .onConflictDoNothing();
  }
  console.log(
    `[digest] ${newJobs.length} vaga(s) — ${realSend ? "enviado via Resend (marcadas como vistas)" : "preview console (não marcado)"}.`,
  );
  return { sent: realSend, count: newJobs.length };
}
