import { describe, it, expect } from "vitest";
import { dedupClusterKey } from "./dedup";

describe("dedupClusterKey", () => {
  it("mesma vaga com caixa/acento/espaço diferentes → MESMA chave", () => {
    const a = dedupClusterKey({ company: "Nubank", title: "Engenheiro de Software", uf: "SP" });
    const b = dedupClusterKey({ company: "  NUBANK ", title: "engenheiro  de  software", uf: "SP" });
    expect(a).toBe(b);
  });

  it("pontuação não altera a chave", () => {
    const a = dedupClusterKey({ company: "Nu Bank!", title: "Dev (Backend)", uf: "RJ" });
    const b = dedupClusterKey({ company: "Nu Bank", title: "Dev Backend", uf: "RJ" });
    expect(a).toBe(b);
  });

  it("UF diferente → chave diferente (mesma vaga em SP e RJ são distintas)", () => {
    const sp = dedupClusterKey({ company: "Acme", title: "Analista", uf: "SP" });
    const rj = dedupClusterKey({ company: "Acme", title: "Analista", uf: "RJ" });
    expect(sp).not.toBe(rj);
  });

  it("título diferente → chave diferente", () => {
    const a = dedupClusterKey({ company: "Acme", title: "Analista Jr", uf: "SP" });
    const b = dedupClusterKey({ company: "Acme", title: "Analista Sr", uf: "SP" });
    expect(a).not.toBe(b);
  });

  it("uf null vira parte estável da chave (não quebra)", () => {
    const a = dedupClusterKey({ company: "Acme", title: "Dev", uf: null });
    const b = dedupClusterKey({ company: "Acme", title: "Dev", uf: null });
    expect(a).toBe(b);
    expect(a).not.toBe(dedupClusterKey({ company: "Acme", title: "Dev", uf: "SP" }));
  });
});
