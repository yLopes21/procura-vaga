import type { NextAuthConfig } from "next-auth";
import { isEmailAllowed } from "@/lib/auth/allowlist";
import { env } from "@/lib/env";

/**
 * Config edge-safe do Auth.js — SEM adapter nem Node APIs, para o middleware
 * (que roda no edge) poder importá-la. O adapter Drizzle e o provider Resend
 * vivem em `auth.ts` (Node runtime). Sessão em JWT: o middleware lê o cookie
 * sem tocar no banco.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  // Providers reais entram em `auth.ts` (Node). Aqui fica vazio: o middleware
  // edge só precisa dos callbacks para ler a sessão JWT.
  providers: [],
  callbacks: {
    /** 2ª barreira (login é por senha): só o `ALLOWED_EMAIL` completa o login. Fail-closed. */
    signIn({ user }) {
      return isEmailAllowed(user.email, env.ALLOWED_EMAIL);
    },
    /** Middleware: protege toda rota coberta pelo matcher; sem sessão → /login. */
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
    /** Leva o id do user para o JWT (no login) e do JWT para a sessão. Edge-safe. */
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
