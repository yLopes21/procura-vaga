import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb, schema } from "@/lib/db";
import { isEmailAllowed } from "@/lib/auth/allowlist";
import { authConfig } from "./auth.config";
import { env, requireEnv } from "@/lib/env";

/** HTML mínimo do e-mail de acesso (sem imagens externas, ATS/spam-safe). */
function magicLinkEmail(url: string): string {
  return `<!doctype html><html lang="pt-BR"><body style="font-family:system-ui,-apple-system,sans-serif;background:#fafafa;padding:24px;color:#18181b">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:32px">
    <h1 style="font-size:18px;margin:0 0 8px">Entrar no Procura-Vaga</h1>
    <p style="font-size:14px;color:#52525b;margin:0 0 24px">Clique no botão para acessar. O link expira em breve e só funciona uma vez.</p>
    <a href="${url}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600">Entrar</a>
    <p style="font-size:12px;color:#a1a1aa;margin:24px 0 0">Se você não pediu este acesso, ignore este e-mail.</p>
  </div></body></html>`;
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
    Resend({
      apiKey: env.EMAIL_TRANSPORT === "resend" ? requireEnv("RESEND_API_KEY") : (env.RESEND_API_KEY ?? "re_missing"),
      from: env.EMAIL_FROM,
      /**
       * Allowlist também no ENVIO (defesa em profundidade): e-mail fora da
       * allowlist não dispara nada — protege a cota grátis do Resend e não
       * revela se o endereço "existe". O callback signIn barra de novo no clique.
       */
      async sendVerificationRequest({ identifier, url, provider }) {
        if (!isEmailAllowed(identifier, env.ALLOWED_EMAIL)) {
          console.warn("[auth] tentativa de acesso por e-mail não autorizado");
          return;
        }
        if (env.EMAIL_TRANSPORT === "console") {
          if (env.NODE_ENV === "production") {
            throw new Error("EMAIL_TRANSPORT=console proibido em produção (fail-closed).");
          }
          console.log(`\n🔑 Magic link para ${identifier}:\n${url}\n`);
          return;
        }
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: provider.from,
            to: identifier,
            subject: "Seu acesso ao Procura-Vaga",
            html: magicLinkEmail(url),
          }),
        });
        if (!res.ok) {
          console.error("[auth:resend] envio falhou", res.status, await res.text());
          throw new Error(`Resend falhou (${res.status}).`);
        }
      },
    }),
  ],
});
