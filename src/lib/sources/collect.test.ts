import { describe, it, expect } from "vitest";
import { collectQuerySource, dedupRaws, type CollectAcc } from "./collect";
import type { RawJobFromATS } from "./types";

const noDelay = () => Promise.resolve();
const acc = (): CollectAcc => ({ raws: [], errors: [], perSource: {} });
const raw = (source: string, id: string): RawJobFromATS => ({
  source,
  sourceJobId: id,
  applyUrl: `https://x.com/${id}`,
  company: "C",
  title: "T",
  locationRaw: null,
  updatedAt: null,
});

describe("collectQuerySource (kill-switch por fonte)", () => {
  it("acumula vagas de todas as queries quando há sucesso", async () => {
    const a = acc();
    await collectQuerySource("fonte", async (q) => [raw("fonte", q)], ["a", "b"], a, noDelay);
    expect(a.raws).toHaveLength(2);
    expect(a.perSource.fonte).toBe(2);
    expect(a.errors).toHaveLength(0);
  });

  it("break em chave ausente (requireEnv) — 1 aviso só, não tenta as demais queries", async () => {
    const a = acc();
    let calls = 0;
    await collectQuerySource(
      "adzuna",
      async () => {
        calls++;
        throw new Error("Variável de ambiente ausente: ADZUNA_APP_ID. Preencha o .env.local.");
      },
      ["a", "b", "c"],
      a,
      noDelay,
    );
    expect(calls).toBe(1);
    expect(a.errors).toHaveLength(1);
  });

  it("break em HTTP 4xx (ex.: 403 not subscribed)", async () => {
    const a = acc();
    let calls = 0;
    await collectQuerySource(
      "jsearch",
      async () => {
        calls++;
        throw new Error('jsearch "x": HTTP 403');
      },
      ["a", "b"],
      a,
      noDelay,
    );
    expect(calls).toBe(1);
  });

  it("continue em falha PONTUAL (rede/5xx) — tenta as próximas queries", async () => {
    const a = acc();
    let calls = 0;
    await collectQuerySource(
      "fonte",
      async (q) => {
        calls++;
        if (q === "a") throw new Error("fonte: fetch failed");
        return [raw("fonte", q)];
      },
      ["a", "b", "c"],
      a,
      noDelay,
    );
    expect(calls).toBe(3); // não parou em "a"
    expect(a.raws).toHaveLength(2); // b e c entraram
    expect(a.errors).toHaveLength(1); // só "a" falhou
  });
});

describe("dedupRaws", () => {
  it("colapsa duplicatas por (source, sourceJobId), mantendo a última ocorrência", () => {
    const out = dedupRaws([raw("g", "1"), raw("g", "2"), { ...raw("g", "1"), title: "ATUALIZADO" }]);
    expect(out).toHaveLength(2);
    expect(out.find((r) => r.sourceJobId === "1")?.title).toBe("ATUALIZADO");
  });

  it("mesmo id de fontes diferentes NÃO colapsa", () => {
    expect(dedupRaws([raw("g", "1"), raw("v", "1")])).toHaveLength(2);
  });
});
