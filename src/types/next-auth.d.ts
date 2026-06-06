import type { DefaultSession } from "next-auth";

/** Expõe `user.id` na sessão e `id` no JWT (preenchidos pelos callbacks em auth.config). */
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
