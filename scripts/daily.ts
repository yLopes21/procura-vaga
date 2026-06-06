/**
 * Entrypoint da coleta diária (`pnpm scrape` / `scrape:ci`). Shim fino: a lógica
 * vive em src/lib/jobs/runDaily.ts (reutilizada pelo endpoint do Vercel Cron).
 * `process.exit(1)` SÓ no catch — nunca no sucesso (exit abrupto com a conexão do
 * Neon aberta crasha o libuv no Windows; ver errors/process-exit-...).
 */
import { runDailyCollect } from "../src/lib/jobs/runDaily";

// runDailyCollect já loga o resumo internamente — o shim só trata a falha fatal.
runDailyCollect().catch((e) => {
  console.error("Falha fatal na coleta:", e);
  process.exit(1);
});
