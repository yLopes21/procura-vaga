/**
 * Entrypoint do digest diário (cron e `pnpm digest`).
 * Roda DEPOIS do `pnpm scrape` no workflow: a coleta enche o catálogo, o digest
 * avisa o dono das vagas novas. Falha com exit 1 para o cron sinalizar erro.
 */
import { runDigest } from "../src/lib/notify/sendDigest";

runDigest()
  .then((r) => {
    // Sem process.exit(0): deixa o Node encerrar naturalmente após fechar a conexão.
    // exit() abrupto com handle do Neon aberto crasha o libuv no Windows (UV_HANDLE_CLOSING).
    console.log(`=== Digest === sent=${r.sent} · count=${r.count}`);
  })
  .catch((e) => {
    console.error("Falha fatal no digest:", e);
    process.exit(1);
  });
