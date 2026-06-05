"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export interface LoginState {
  status: "idle" | "sent" | "error";
  message?: string;
}

/**
 * Dispara o magic-link. A mensagem de sucesso é DELIBERADAMENTE vaga ("se este
 * e-mail tiver acesso") — não revela se o endereço está na allowlist
 * (anti-enumeração). A allowlist real barra no envio e no clique.
 */
export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { status: "error", message: "Informe um e-mail." };

  try {
    await signIn("resend", { email, redirect: false });
    return {
      status: "sent",
      message: "Se este e-mail tiver acesso, o link de entrada já está a caminho. Confira sua caixa de entrada.",
    };
  } catch (e) {
    if (e instanceof AuthError) {
      return { status: "error", message: "Não foi possível enviar agora. Tente novamente em instantes." };
    }
    // Re-lança o redirect interno do Next (NEXT_REDIRECT) para o framework tratar.
    if (typeof (e as { digest?: unknown }).digest === "string" && (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    console.error("[auth:sendMagicLink] erro inesperado:", e);
    return { status: "error", message: "Erro interno. Tente novamente em instantes." };
  }
}
