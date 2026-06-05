import { describe, it, expect } from "vitest";
import { staleJobIds, shouldAbortClosing, collectionLooksBroken } from "./listingDiff";

const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-06-05T00:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * day);

describe("staleJobIds (fechar por last_seen_at defasado, não por 1 coleta)", () => {
  it("vaga active não vista há mais de N dias → stale", () => {
    const jobs = [
      { id: "a", status: "active", lastSeenAt: daysAgo(10) },
      { id: "b", status: "active", lastSeenAt: daysAgo(2) },
    ];
    expect(staleJobIds(jobs, now, 7)).toEqual(["a"]);
  });

  it("vaga já closed não é retornada (idempotente)", () => {
    const jobs = [{ id: "c", status: "closed", lastSeenAt: daysAgo(30) }];
    expect(staleJobIds(jobs, now, 7)).toEqual([]);
  });

  it("vaga vista hoje nunca é stale", () => {
    const jobs = [{ id: "d", status: "active", lastSeenAt: now }];
    expect(staleJobIds(jobs, now, 7)).toEqual([]);
  });
});

describe("shouldAbortClosing (circuit-breaker contra coleta parcial)", () => {
  it("fecharia mais da metade das active → aborta (provável falha de coleta)", () => {
    expect(shouldAbortClosing(6, 10, 0.5)).toBe(true);
  });

  it("fecharia poucas → segue", () => {
    expect(shouldAbortClosing(2, 10, 0.5)).toBe(false);
  });

  it("nenhuma active → não aborta (nada a fechar, sem divisão por zero)", () => {
    expect(shouldAbortClosing(0, 0, 0.5)).toBe(false);
  });

  it("exatamente no limiar não aborta (estritamente maior)", () => {
    expect(shouldAbortClosing(5, 10, 0.5)).toBe(false);
  });
});

describe("collectionLooksBroken (coleta vazia não pode fechar vagas)", () => {
  it("0 coletadas → coleta quebrada (provável falha de rede): não fecha nada", () => {
    expect(collectionLooksBroken(0)).toBe(true);
  });

  it("coletou vagas → coleta saudável: fechamento por defasagem pode rodar", () => {
    expect(collectionLooksBroken(287)).toBe(false);
  });
});
