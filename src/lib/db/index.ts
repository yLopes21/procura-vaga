import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { requireEnv } from "@/lib/env";
import * as schema from "./schema";

/**
 * Cliente Drizzle sobre o driver HTTP do Neon (serverless/edge-friendly),
 * inicializado de forma PREGUIÇOSA: a conexão só é resolvida na 1ª chamada de
 * getDb(), nunca no import do módulo. Assim, importar uma rota que não usa o
 * banco — ou um cold start sem DATABASE_URL — não derruba o processo no
 * carregamento; o erro (se houver) aparece claro no ponto de uso.
 *
 * Nota: o driver neon-http NÃO suporta transações multi-statement. Jobs que
 * exigem atomicidade (ex.: ingestão diária) usam o driver Pool/WebSocket
 * (drizzle-orm/neon-serverless) em seu próprio módulo.
 */
type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

let client: DrizzleClient | undefined;

export function getDb(): DrizzleClient {
  if (!client) {
    const sql = neon(requireEnv("DATABASE_URL"));
    client = drizzle(sql, { schema });
  }
  return client;
}

export { schema };
