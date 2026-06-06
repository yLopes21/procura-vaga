import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchHtmlWithRetry } from "./http";

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
