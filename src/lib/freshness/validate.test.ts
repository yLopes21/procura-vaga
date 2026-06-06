import { describe, it, expect, vi, afterEach } from "vitest";
import { isSafeApplyUrl, fetchValidation } from "./validate";

afterEach(() => vi.unstubAllGlobals());

describe("fetchValidation — anti-SSRF em redirect (re-valida cada hop)", () => {
  it("redirect para o IP de metadata da cloud é barrado, sem seguir (fail-closed)", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      status: 302,
      headers: new Headers({ location: "http://169.254.169.254/latest/meta-data" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const r = await fetchValidation("https://acme.gupy.io/job/123");
    expect(r?.httpStatus).toBe(0); // não confia na resposta
    expect(fetchMock).toHaveBeenCalledTimes(1); // NÃO seguiu o redirect inseguro
  });

  it("segue redirect seguro e retorna a resposta final", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 301, headers: new Headers({ location: "https://acme.gupy.io/job/123/apply" }) })
      .mockResolvedValueOnce({ status: 200, headers: new Headers(), text: async () => "candidate-se já" });
    vi.stubGlobal("fetch", fetchMock);
    const r = await fetchValidation("https://acme.gupy.io/job/123");
    expect(r?.httpStatus).toBe(200);
    expect(r?.finalUrl).toBe("https://acme.gupy.io/job/123/apply");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("isSafeApplyUrl (anti-SSRF: só URL pública http/https)", () => {
  it("aceita https/http público", () => {
    expect(isSafeApplyUrl("https://acme.gupy.io/job/123")).toBe(true);
    expect(isSafeApplyUrl("http://job-boards.greenhouse.io/x")).toBe(true);
  });

  it("rejeita protocolo não-http", () => {
    expect(isSafeApplyUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeApplyUrl("ftp://x.com")).toBe(false);
    expect(isSafeApplyUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejeita localhost, loopback e IPs privados", () => {
    expect(isSafeApplyUrl("http://localhost/x")).toBe(false);
    expect(isSafeApplyUrl("http://127.0.0.1/x")).toBe(false);
    expect(isSafeApplyUrl("http://10.0.0.5/x")).toBe(false);
    expect(isSafeApplyUrl("http://192.168.1.1/x")).toBe(false);
    expect(isSafeApplyUrl("http://172.16.0.1/x")).toBe(false);
  });

  it("rejeita o endpoint de metadata da cloud (169.254.169.254)", () => {
    expect(isSafeApplyUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
  });

  it("rejeita hostname interno sem ponto e lixo", () => {
    expect(isSafeApplyUrl("http://intranet/x")).toBe(false);
    expect(isSafeApplyUrl("not a url")).toBe(false);
    expect(isSafeApplyUrl("")).toBe(false);
  });
});
