import { afterEach, describe, expect, it, vi } from "vitest";
import { hardenCookieOptions } from "@/lib/supabase/cookie-options";

describe("hardenCookieOptions", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("força httpOnly para o token não ser legível via document.cookie", () => {
    expect(hardenCookieOptions({ path: "/" }).httpOnly).toBe(true);
  });

  it("define sameSite=lax por padrão e preserva um sameSite explícito", () => {
    expect(hardenCookieOptions({}).sameSite).toBe("lax");
    expect(hardenCookieOptions({ sameSite: "strict" }).sameSite).toBe("strict");
  });

  it("remove expires e maxAge (mantém cookie de sessão)", () => {
    const out = hardenCookieOptions({ expires: new Date(), maxAge: 3600, path: "/" });
    expect(out).not.toHaveProperty("expires");
    expect(out).not.toHaveProperty("maxAge");
    expect(out.path).toBe("/");
  });

  it("aplica secure em produção e omite fora dela", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(hardenCookieOptions({}).secure).toBe(true);
    vi.stubEnv("NODE_ENV", "development");
    expect(hardenCookieOptions({}).secure).toBe(false);
  });

  it("não quebra quando options é undefined", () => {
    expect(hardenCookieOptions().httpOnly).toBe(true);
  });
});
