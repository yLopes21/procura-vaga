"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export interface LoginState {
  status: "idle" | "error";
  message?: string;
}

/** Mensagem única (anti-enumeração): não revela se foi usuário inexistente ou senha errada. */
const GENERIC_ERROR = "Usuário ou senha inválidos.";

/**
 * Login por usuário/e-mail + senha (Credentials). Sucesso → redirect "/".
 * Falha → mensagem genérica única. Nunca loga identifier nem senha.
 */
export async function signInWithPassword(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!identifier || !password) return { status: "error", message: "Preencha usuário e senha." };

  try {
    await signIn("credentials", { identifier, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return { status: "error", message: GENERIC_ERROR };
    // Re-lança o redirect interno do Next (NEXT_REDIRECT) — não é erro.
    if (
      typeof (e as { digest?: unknown }).digest === "string" &&
      (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw e;
    }
    console.error("[auth:signInWithPassword] erro inesperado");
    return { status: "error", message: GENERIC_ERROR };
  }
  // Fora do try: redirect() lança NEXT_REDIRECT internamente; só roda se o login passou.
  redirect("/");
}
