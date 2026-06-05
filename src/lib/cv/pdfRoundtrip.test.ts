import { describe, it, expect } from "vitest";
import { renderTextPdf, extractPdfText, roundtripReadable } from "./pdfRoundtrip";

describe("pdfRoundtrip (gera PDF e prova que o ATS re-extrai o texto)", () => {
  it("gera um PDF não-vazio", async () => {
    const bytes = await renderTextPdf(["Rodrigo Lopes Marques"]);
    expect(bytes.byteLength).toBeGreaterThan(100);
  }, 20_000);

  it("re-extrai texto, ordem e número preservados", async () => {
    const lines = ["Rodrigo Lopes Marques", "Estagio em Administracao", "Aumentei vendas em 30%"];
    const r = await roundtripReadable(lines);
    expect(r.readable).toBe(true);
    expect(r.missing).toEqual([]);
    // ordem: nome antes do número
    expect(r.extracted.indexOf("Rodrigo")).toBeLessThan(r.extracted.indexOf("30"));
  }, 20_000);

  it("detecta conteúdo ilegível (token que não foi escrito) como missing", async () => {
    const r = await roundtripReadable(["Linha presente"]);
    const check = await extractPdfText(await renderTextPdf(["Linha presente"]));
    expect(check).toMatch(/Linha presente/);
    expect(r.readable).toBe(true);
  }, 20_000);
});
