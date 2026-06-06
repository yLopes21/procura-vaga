import type { MetadataRoute } from "next";

/**
 * Manifest do PWA (Next serve em /manifest.webmanifest e injeta o <link> no <head>).
 * App privado de 1 usuário; instalável no celular, abre em tela cheia (standalone).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Procura-Vaga",
    short_name: "Procura-Vaga",
    description: "Busca pessoal de vagas abertas + currículo adaptado",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
