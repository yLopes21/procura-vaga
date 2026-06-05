import { PDFDocument, StandardFonts } from "pdf-lib";

/**
 * Round-trip do PDF do currículo: gera o PDF e RE-EXTRAI o texto com o mesmo
 * motor que um ATS usaria (pdf.js), provando que a máquina lê o que o humano vê.
 * É a defesa contra "currículo bonito que o ATS não consegue ler".
 *
 * A extração roda só no servidor (Node): pdf.js precisa de DOMMatrix (via
 * @napi-rs/canvas) e do worker legacy apontado por uma file:// URL. Tudo é
 * carregado por import dinâmico para não entrar no bundle do cliente.
 */

/** Gera um PDF simples com uma linha por entrada (fonte padrão, WinAnsi). */
export async function renderTextPdf(lines: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]); // A4
  let y = 800;
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: 12, font });
    y -= 20;
  }
  return doc.save();
}

interface PdfjsBundle {
  pdfjs: typeof import("pdfjs-dist/legacy/build/pdf.mjs");
  standardFontDataUrl: string;
}

let pdfjsPromise: Promise<PdfjsBundle> | null = null;

async function loadPdfjs(): Promise<PdfjsBundle> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const { createRequire } = await import("node:module");
      const { pathToFileURL } = await import("node:url");
      const { dirname, join } = await import("node:path");
      const require = createRequire(import.meta.url);
      const canvas = await import("@napi-rs/canvas");
      // pdf.js usa DOMMatrix ao processar transforms de texto — ausente em Node.
      (globalThis as Record<string, unknown>).DOMMatrix ??= canvas.DOMMatrix;
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
        require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs"),
      ).href;
      const fontsDir = join(dirname(require.resolve("pdfjs-dist/package.json")), "standard_fonts/");
      return { pdfjs, standardFontDataUrl: pathToFileURL(fontsDir).href };
    })();
  }
  return pdfjsPromise;
}

/** Extrai todo o texto de um PDF (na ordem do layout), via pdf.js em Node. */
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const { pdfjs, standardFontDataUrl } = await loadPdfjs();
  const task = pdfjs.getDocument({
    data: bytes,
    isEvalSupported: false,
    useWorkerFetch: false,
    disableFontFace: true,
    standardFontDataUrl,
  });
  const pdf = await task.promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((it) => ("str" in it ? it.str : "")).join(" "));
  }
  return pages.join("\n");
}

export interface RoundtripResult {
  readable: boolean;
  extracted: string;
  /** Linhas esperadas que NÃO foram re-extraídas (ATS não leria). */
  missing: string[];
}

const norm = (s: string): string =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Gera o PDF a partir das linhas e confirma que cada uma é re-extraível. */
export async function roundtripReadable(lines: string[]): Promise<RoundtripResult> {
  const bytes = await renderTextPdf(lines);
  const extracted = await extractPdfText(bytes);
  const hay = norm(extracted);
  const missing = lines.filter((line) => !hay.includes(norm(line)));
  return { readable: missing.length === 0, extracted, missing };
}
