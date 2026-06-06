import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { buildRecruiterDraft } from "@/lib/recruiter/draft";

/**
 * Rascunho de abordagem ao recrutador para uma vaga (texto + link de busca no
 * LinkedIn). Só LÊ a vaga e gera texto — não dispara nada em nome do usuário.
 * GET para ser idempotável/cacheável; protegido (middleware + auth() aqui).
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const jobId = new URL(req.url).searchParams.get("jobId");
  if (!jobId || !z.string().uuid().safeParse(jobId).success) {
    return NextResponse.json({ error: "jobId inválido" }, { status: 400 });
  }

  const db = getDb();
  const [job] = await db
    .select({ title: jobs.title, company: jobs.company })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);
  if (!job) return NextResponse.json({ error: "vaga não encontrada" }, { status: 404 });

  return NextResponse.json(buildRecruiterDraft(job));
}
