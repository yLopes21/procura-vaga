import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

/** Diagnóstico read-only da tabela user (quantos, e-mail, se já têm username/hash). */
const sql = neon(process.env.DATABASE_URL);
const [{ n }] = await sql`select count(*)::int as n from "user"`;
console.log("users:", n);
if (n > 0) {
  // username/password_hash podem não existir antes da migration — consulta tolerante.
  const cols = await sql`
    select column_name from information_schema.columns
    where table_name = 'user' and column_name in ('username', 'password_hash')
  `;
  const hasNewCols = cols.length === 2;
  const rows = hasNewCols
    ? await sql`select id, email, username, (password_hash is not null) as has_hash from "user" limit 5`
    : await sql`select id, email from "user" limit 5`;
  for (const r of rows) {
    console.log(`  ${r.email} (${String(r.id).slice(0, 8)})${hasNewCols ? ` username=${r.username ?? "-"} hash=${r.has_hash}` : ""}`);
  }
}
