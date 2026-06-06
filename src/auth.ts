import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { authConfig } from "./auth.config";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { checkRateLimit } from "@/lib/auth/rateLimit";

/**
 * Auth.js (Node runtime) — login por usuário/e-mail + senha (Credentials).
 * Substitui o magic-link. NÃO há signup: usuários só nascem via `pnpm seed:user`
 * (uso pessoal). Sessão em JWT (ver auth.config). `verifyPassword` usa node:crypto,
 * por isso o route /api/auth roda em runtime nodejs.
 */
const credentialsSchema = z.object({
  identifier: z.string().trim().min(1).max(320),
  password: z.string().min(1).max(200),
});

/**
 * Hash dummy de custo equivalente ao real, computado uma única vez (lazy).
 * Quando o identifier não existe, comparamos a senha contra ELE para pagar o
 * mesmo scrypt — fecha o canal lateral de timing (anti-enumeração temporal).
 * Nunca concede acesso: só retornamos sucesso com user real + senha correta.
 */
// Singleton memoizado: resolve uma vez e nunca é regravado (Node é single-thread,
// sem race real); `let` apenas para o lazy-init na primeira chamada.
let dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword("timing-equalizer-not-a-real-credential");
  }
  return dummyHashPromise;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(getDb(), {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers: [
    Credentials({
      credentials: { identifier: {}, password: {} },
      /**
       * Valida usuário/e-mail + senha. Retorna o user (sem o hash) ou null —
       * NUNCA lança. Resposta única para "não existe" e "senha errada"
       * (anti-enumeração). Rate-limit best-effort antes de comparar o hash.
       */
      async authorize(raw, req) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { identifier, password } = parsed.data;
        const ident = identifier.toLowerCase();

        const ip = req?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        if (!checkRateLimit(`${ip}:${ident}`).allowed) return null;

        try {
          const db = getDb();
          const [user] = await db
            .select({
              id: schema.users.id,
              name: schema.users.name,
              email: schema.users.email,
              image: schema.users.image,
              passwordHash: schema.users.passwordHash,
            })
            .from(schema.users)
            .where(sql`lower(${schema.users.email}) = ${ident} OR lower(${schema.users.username}) = ${ident}`)
            .limit(1);
          // Paga scrypt SEMPRE (hash real ou dummy de mesmo custo) para que
          // "usuário inexistente" e "senha errada" levem o mesmo tempo. (Falha de
          // banco cai no catch abaixo e não distingue usuários — não enumera.)
          const hashToCheck = user?.passwordHash ?? (await getDummyHash());
          const passwordOk = await verifyPassword(password, hashToCheck);
          if (!user || !user.passwordHash || !passwordOk) return null;
          return { id: user.id, name: user.name, email: user.email, image: user.image };
        } catch {
          // Erro inesperado (ex.: banco indisponível) — fail-closed, sem logar credenciais.
          console.error("[auth:credentials] erro inesperado no authorize");
          return null;
        }
      },
    }),
  ],
});
