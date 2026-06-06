/**
 * Gera os ícones do PWA (monograma "PV" em fundo zinc-900, com safe-zone p/ máscara).
 * Reproduzível: `pnpm tsx scripts/gen-icons.mts`. Saída versionada em public/ e src/app/.
 */
import { createCanvas } from "@napi-rs/canvas";
import { writeFileSync, mkdirSync } from "node:fs";

const BG = "#18181b";
const FG = "#fafafa";

function icon(size: number, file: string, safeZone = false): void {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, size, size);
  // safe-zone: ícone maskable mantém o conteúdo dentro de ~70% central
  const scale = safeZone ? 0.34 : 0.44;
  ctx.fillStyle = FG;
  ctx.font = `bold ${Math.round(size * scale)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PV", size / 2, size / 2 + size * 0.03);
  writeFileSync(file, canvas.toBuffer("image/png"));
  console.log(`  ${file} (${size}px)`);
}

mkdirSync("public", { recursive: true });
console.log("Gerando ícones do PWA:");
icon(192, "public/icon-192.png", true);
icon(512, "public/icon-512.png", true);
icon(180, "src/app/apple-icon.png");
icon(48, "src/app/icon.png");
console.log("OK.");
