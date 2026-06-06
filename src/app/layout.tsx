import "./globals.css";
import type { Metadata, Viewport } from "next";
import { SwRegister } from "@/components/sw-register";

// O <link rel="manifest"> e os ícones são injetados pelo Next via app/manifest.ts,
// app/icon.png e app/apple-icon.png (convenção) — sem caminhos manuais que dão 404.
export const metadata: Metadata = {
  title: "Procura-Vaga",
  description: "Busca pessoal de vagas abertas + currículo adaptado",
  appleWebApp: { capable: true, title: "Procura-Vaga", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
