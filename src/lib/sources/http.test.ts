import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchHtmlWithRetry, fetchJsonWithRetry } from "./http";

afterEach(() => vi.unstubAllGlobals());

describe("fetchHtmlWithRetry", () => {
  it("retorna o HTML quando o fetch sucede de primeira", async () => {
    const f = vi.fn().mockResolvedValue(new Response("<html>ok</html>", { status: 200 }));
    vi.stubGlobal("fetch", f);
    const html = await fetchHtmlWithRetry("https://x.com", "x", { retries: 2, backoffMs: 0 });
    expect(html).toContain("ok");
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("retenta em falha de conexão transitória e sucede (caso UND_ERR_CONNECT_TIMEOUT)", async () => {
    const f = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(new Response("<html>ok</html>", { status: 200 }));
    vi.stubGlobal("fetch", f);
    const html = await fetchHtmlWithRetry("https://x.com", "x", { retries: 2, backoffMs: 0 });
    expect(html).toContain("ok");
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("esgota as tentativas e lança (1 inicial + N retries)", async () => {
    const f = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", f);
    await expect(fetchHtmlWithRetry("https://x.com", "x", { retries: 2, backoffMs: 0 })).rejects.toThrow();
    expect(f).toHaveBeenCalledTimes(3);
  });

  it("não retenta erro 4xx (cliente) — falha imediata", async () => {
    const f = vi.fn().mockResolvedValue(new Response("nope", { status: 404 }));
    vi.stubGlobal("fetch", f);
    await expect(
      fetchHtmlWithRetry("https://x.com", "x", { retries: 3, backoffMs: 0 }),
    ).rejects.toThrow(/404/);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("retenta em 5xx (servidor — pode ser transitório)", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(new Response("err", { status: 503 }))
      .mockResolvedValueOnce(new Response("<html>ok</html>", { status: 200 }));
    vi.stubGlobal("fetch", f);
    const html = await fetchHtmlWithRetry("https://x.com", "x", { retries: 2, backoffMs: 0 });
    expect(html).toContain("ok");
    expect(f).toHaveBeenCalledTimes(2);
  });
});

describe("fetchJsonWithRetry", () => {
  it("retorna o JSON já parseado", async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: 1 }), { status: 200 }));
    vi.stubGlobal("fetch", f);
    const data = await fetchJsonWithRetry("https://x.com", "x", {}, { retries: 1, backoffMs: 0 });
    expect(data).toEqual({ ok: 1 });
  });

  it("repassa method/headers/body do init (ex.: POST do Jooble)", async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ jobs: [] }), { status: 200 }));
    vi.stubGlobal("fetch", f);
    await fetchJsonWithRetry(
      "https://x.com",
      "x",
      { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } },
      { retries: 0, backoffMs: 0 },
    );
    expect(f).toHaveBeenCalledWith("https://x.com", expect.objectContaining({ method: "POST", body: "{}" }));
  });

  it("retenta erro transitório e sucede", async () => {
    const f = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: 1 }), { status: 200 }));
    vi.stubGlobal("fetch", f);
    expect(await fetchJsonWithRetry("https://x.com", "x", {}, { retries: 2, backoffMs: 0 })).toEqual({ ok: 1 });
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("não retenta 4xx (ex.: 403 not subscribed do JSearch)", async () => {
    const f = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "You are not subscribed to this API." }), { status: 403 }),
    );
    vi.stubGlobal("fetch", f);
    await expect(fetchJsonWithRetry("https://x.com", "x", {}, { retries: 3, backoffMs: 0 })).rejects.toThrow(/403/);
    expect(f).toHaveBeenCalledTimes(1);
  });
});
