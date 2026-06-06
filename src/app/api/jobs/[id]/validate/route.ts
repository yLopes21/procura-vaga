import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { fetchValidation } from "@/lib/freshness/validate";
import { classifyJobStatus, toDbStatus } from "@/lib/freshness/closeSignals";

/**
 * Validação no clique — o coração de "nunca exibir vaga morta".
 * Faz 1 fetch on-demand (anti-SSRF) da apply_url, classifica e PERSISTE:
 *  - "closed" → marca closed + closed_at (some da busca);
 *  - "open"   → garante active;
 *  - "unknown" → NÃO mexe no status (incerteza não esconde vaga), só carimba last_validated_at.
 * Rota protegida pelo middleware (exige sessão); reforça com auth() aqui.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const [job] = await db
    .select({ applyUrl: jobs.applyUrl })
    .from(jobs)
    .where(eq(jobs.id, id))
    .limit(1);
  if (!job) return NextResponse.json({ error: "vaga não encontrada" }, { status: 404 });

  const input = await fetchValidation(job.applyUrl);
  if (!input) {
    return NextResponse.json({ status: "unknown", reason: "url não validável", applyUrl: job.applyUrl });
  }

  const result = classifyJobStatus(input);

  const updates: Record<string, unknown> = { lastValidatedAt: sql`now()` };
  if (result.status === "closed") {
    updates.status = toDbStatus("closed");
    updates.closedAt = sql`now()`;
  } else if (result.status === "open") {
    updates.status = toDbStatus("open"); // active
  }
  await db.update(jobs).set(updates).where(eq(jobs.id, id));

  return NextResponse.json({ status: result.status, reason: result.reason, applyUrl: job.applyUrl });
}
