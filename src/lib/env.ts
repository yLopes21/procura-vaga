import { z } from "zod";

/**
 * Validação central de variáveis de ambiente.
 * Tudo é opcional no parse (o app sobe sem todas as chaves), mas cada
 * integração chama `requireEnv` no ponto de uso → falha clara e localizada
 * em vez de `undefined` silencioso.
 */
const schema = z.object({
  // Banco (Neon)
  DATABASE_URL: z.string().optional(),
  // Auth
  AUTH_SECRET: process.env.NODE_ENV === "production" ? z.string().min(32) : z.string().optional(),
  AUTH_URL: z.string().optional(),
  ALLOWED_EMAIL: z.string().email().optional(),
  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("onboarding@resend.dev"),
  // Fontes de vaga
  RAPIDAPI_KEY: z.string().optional(),
  ADZUNA_APP_ID: z.string().optional(),
  ADZUNA_APP_KEY: z.string().optional(),
  JOOBLE_API_KEY: z.string().optional(),
  // LLM do currículo
  LLM_PROVIDER: z.enum(["gemini", "anthropic", "groq"]).default("gemini"),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  // App
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Transporte do magic-link: "console" imprime o link no terminal (dev, sem
  // Resend); "resend" envia de verdade. A escolha segura por ambiente vive em
  // getEmailProvider() (Onda Auth) — nunca cai no console em produção.
  EMAIL_TRANSPORT: z.enum(["console", "resend"]).default("console"),
});

export const env = schema.parse(process.env);

export type Env = typeof env;

/** Lê uma env obrigatória no ponto de uso; lança erro claro se ausente. */
export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env[key];
  if (value === undefined || value === "") {
    throw new Error(`Variável de ambiente ausente: ${String(key)}. Preencha o .env.local.`);
  }
  return value as NonNullable<Env[K]>;
}
