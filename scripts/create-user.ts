/**
 * Cria/atualiza um usuário de login (uso pessoal — não há signup público).
 * UPSERT por e-mail: se o usuário já existe (ex.: o do magic-link), só adiciona
 * username + hash de senha. A senha vem de SEED_PASSWORD (env temporário), NUNCA
 * de argv nem hardcoded — não entra no repo nem no histórico de shell de forma persistente.
 *
 *   SEED_USERNAME=procuravaga SEED_PASSWORD=... pnpm seed:user
 *
 * Recuperação de lockout: re-rodar com a senha desejada (idempotente).
 */
import { sql, eq } from "drizzle-orm";
import { getDb } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { hashPassword } from "../src/lib/auth/password";

async function main(): Promise<void> {
  const username = (process.env.SEED_USERNAME ?? "procuravaga").trim();
  const email = (process.env.SEED_EMAIL ?? process.env.ALLOWED_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.SEED_PASSWORD ?? "";

  if (!username) throw new Error("SEED_USERNAME vazio.");
  if (!email) throw new Error("SEED_EMAIL ou ALLOWED_EMAIL é obrigatório (e-mail do usuário).");
  if (!password) throw new Error("SEED_PASSWORD é obrigatório (defina TEMPORARIAMENTE no .env.local).");
  if (password.length < 12) throw new Error("SEED_PASSWORD muito curta (mínimo 12 caracteres).");
  // Heurística GENÉRICA de força — NUNCA listar a senha/usuário reais aqui (arquivo versionado).
  const pareceFraca =
    password.length < 16 ||
    /^[a-z]+$/i.test(password) ||
    /^\d+$/.test(password) ||
    /(.)\1{3,}/.test(password) ||
    /(1234|abcd|qwerty|senha|password)/i.test(password);
  if (pareceFraca) {
    console.warn("[create-user] AVISO: senha possivelmente fraca (curta ou pouca variedade). Use uma forte e única.");
  }

  const passwordHash = await hashPassword(password); // nunca logar isto
  const db = getDb();

  // Identifica o user-alvo nos dois eixos de unicidade do banco (e-mail e username),
  // de forma determinística — um lookup só por e-mail cairia no INSERT e colidiria
  // com user_username_lower_idx num re-seed com username repetido.
  const [byEmail] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);
  const [byUsername] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.username}) = ${username.toLowerCase()}`)
    .limit(1);

  // Se o username já existe numa linha que NÃO é a do e-mail passado, abortar:
  // atualizar sobrescreveria o usuário errado; inserir violaria o UNIQUE de username.
  if (byUsername && byEmail?.id !== byUsername.id) {
    throw new Error(
      `[create-user] o username "${username}" já pertence a outro usuário (e-mail diferente). Abortado para não sobrescrever o usuário errado.`,
    );
  }
  const existing = byEmail ?? byUsername;

  if (existing) {
    await db
      .update(users)
      .set({ username, passwordHash, emailVerified: new Date() })
      .where(eq(users.id, existing.id));
    console.log(`[create-user] atualizado: ${username} (${existing.id.slice(0, 8)}…)`);
  } else {
    const [created] = await db
      .insert(users)
      .values({ email, username, passwordHash, emailVerified: new Date() })
      .returning({ id: users.id });
    console.log(`[create-user] criado: ${username} (${created.id.slice(0, 8)}…)`);
  }
}

// process.exit(1) só no catch — nunca no sucesso (exit abrupto com conexão Neon
// aberta crasha o libuv no Windows; ver errors/process-exit-...).
main().catch((e) => {
  console.error("[create-user] falha:", (e as Error).message);
  process.exit(1);
});
