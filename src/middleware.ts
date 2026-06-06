import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Middleware de proteção: usa a config edge-safe (sem adapter). Toda rota que
 * casa o matcher exige sessão; sem ela, o callback `authorized` redireciona
 * para `/login`. Rotas públicas (login, api/auth, assets) ficam de fora do
 * matcher. Card aplicado: "painel sem proteção de rota = acesso público".
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Exclui rotas públicas: Auth.js, login, assets do Next, service worker e os
  // assets do PWA por EXTENSÃO (.png/.svg/.ico/.webmanifest) — robusto a novos
  // ícones. O manifest é /manifest.webmanifest (não .json) no App Router.
  matcher: [
    "/((?!api/auth|api/cron/|login|_next/static|_next/image|sw.js|manifest.webmanifest|.*\\.(?:png|svg|ico|webmanifest)$).*)",
  ],
};
