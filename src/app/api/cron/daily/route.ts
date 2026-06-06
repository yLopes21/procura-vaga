import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { runDailyCollect } from "@/lib/jobs/runDaily";
import { runDigest } from "@/lib/notify/sendDigest";

// cheerio/undici/neon-http exigem Node (não edge); nunca cachear; teto canônico de Function.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron diário (Vercel Cron, ver vercel.json) — coleta + digest, na mesma ordem
 * dos dois steps do GitHub Actions (scrape → digest). Protegido por Bearer
 * (CRON_SECRET); sessão Auth.js não serve (cron não é browser logado), e o
 * middleware já isenta /api/cron. Falha NÃO é engolida (500 com motivo).
 */
export async function GET(req: Request) {
  // env.CRON_SECRET (não requireEnv) p/ NÃO lançar fora do try: ausência vira 401, não 500.
  if (!isAuthorizedCron(req.headers.get("authorization"), env.CRON_SECRET ?? "")) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  try {
    const collect = await runDailyCollect();
    const digest = await runDigest();
    console.log(
      "[cron/daily]",
      JSON.stringify({ ...collect, errors: collect.errors.length, sent: digest.sent }),
    );
    return NextResponse.json({ ok: true, collect, digest });
  } catch (e) {
    console.error("[cron/daily] falha:", e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
