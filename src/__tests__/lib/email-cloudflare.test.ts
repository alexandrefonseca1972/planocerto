import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    AUTH_EMAIL_FROM: "PlanoCerto <acesso@planocerto.app>",
    AUTH_EMAIL_REPLY_TO: "",
    NEXT_PUBLIC_SITE_URL: "https://planocerto.app",
    RESEND_API_KEY: "placeholder-key",
    CLOUDFLARE_ACCOUNT_ID: "acc123",
    CLOUDFLARE_EMAIL_TOKEN: "tok456",
  },
}));

import { parseAddress, sendEmail } from "@/lib/email";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);
const reply = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body });

describe("sendEmail via Cloudflare Email Service", () => {
  beforeEach(() => fetchMock.mockReset());

  it("chama a REST API com remetente nomeado e token, sem reply_to por padrão", async () => {
    fetchMock.mockResolvedValue(reply(200, { success: true, result: { delivered: ["ana@ex.com"], queued: [] } }));
    expect(await sendEmail("ana@ex.com", "Assunto", "<p>oi</p>")).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.cloudflare.com/client/v4/accounts/acc123/email/sending/send");
    expect(init.headers.Authorization).toBe("Bearer tok456");
    expect(JSON.parse(init.body)).toEqual({
      to: "ana@ex.com",
      from: { address: "acesso@planocerto.app", name: "PlanoCerto" },
      subject: "Assunto",
      html: "<p>oi</p>",
    });
  });

  it("envia reply_to quando informado", async () => {
    fetchMock.mockResolvedValue(reply(200, { success: true, result: { delivered: ["ana@ex.com"] } }));
    await sendEmail("ana@ex.com", "A", "<p/>", { replyTo: "x@planocerto.app" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).reply_to).toBe("x@planocerto.app");
  });

  it("aceita entrega enfileirada (queued)", async () => {
    fetchMock.mockResolvedValue(reply(200, { success: true, result: { delivered: [], queued: ["Ana@Ex.com"] } }));
    expect(await sendEmail("ana@ex.com", "A", "<p/>")).toBe(true);
  });

  it("falha se o destinatário voltou como bounce/supressão", async () => {
    fetchMock.mockResolvedValue(reply(200, { success: true, result: { delivered: [], permanent_bounces: ["ana@ex.com"] } }));
    expect(await sendEmail("ana@ex.com", "A", "<p/>")).toBe(false);
  });

  it("falha em erro da API (ex.: token sem permissão)", async () => {
    fetchMock.mockResolvedValue(reply(403, { success: false, errors: [{ code: 10102, message: "email.sending.error.authentication.forbidden" }] }));
    expect(await sendEmail("ana@ex.com", "A", "<p/>")).toBe(false);
  });

  it("falha sem lançar em erro de rede", async () => {
    // Mock próprio do teste: o vitest acusa erro lançado por mock de escopo de módulo, mesmo tratado.
    const failing = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    vi.stubGlobal("fetch", failing);
    try {
      expect(await sendEmail("ana@ex.com", "A", "<p/>")).toBe(false);
      expect(failing).toHaveBeenCalledTimes(1);
    } finally {
      vi.stubGlobal("fetch", fetchMock);
    }
  });

  it("sem destinatário não chama a API", async () => {
    expect(await sendEmail("", "A", "<p/>")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("parseAddress", () => {
  it("separa nome e endereço", () => {
    expect(parseAddress("PlanoCerto <acesso@planocerto.app>")).toEqual({ address: "acesso@planocerto.app", name: "PlanoCerto" });
    expect(parseAddress('"Plano Certo" <a@b.com>')).toEqual({ address: "a@b.com", name: "Plano Certo" });
    expect(parseAddress("a@b.com")).toEqual({ address: "a@b.com" });
  });
});
