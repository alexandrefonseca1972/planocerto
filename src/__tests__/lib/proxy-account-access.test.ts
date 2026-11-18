import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

let status = "inactive";

vi.mock("@/lib/middleware/auth-check", () => ({
  checkAuth: async () => ({ user: { id: "u" }, response: NextResponse.next() }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: async () => ({ data: status, error: null }),
    from: () => {
      const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: null, error: null }) };
      return q;
    },
  }),
}));

import { proxy } from "@/proxy";

const req = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(new URL(path, "https://planocerto.app"), { method: "POST", headers });

describe("proxy aplica conta ativa/horário em todos os caminhos (achado #4)", () => {
  beforeEach(() => { status = "inactive"; });

  it("API: 403", async () => {
    expect((await proxy(req("/api/plans/x/pdf"))).status).toBe(403);
  });

  it("Server Action postada em rota pública: 403", async () => {
    expect((await proxy(req("/", { "next-action": "abc" }))).status).toBe(403);
  });

  it("Server Action em página protegida: 403", async () => {
    expect((await proxy(req("/admin", { "next-action": "abc" }))).status).toBe(403);
  });

  it("página protegida: redireciona para /auth", async () => {
    const res = await proxy(new NextRequest(new URL("/dashboard", "https://planocerto.app")));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/auth?error=");
  });

  it("action em página de auth passa (logout/troca de conta)", async () => {
    // O bloqueado chega em /auth?error=... (redirect acima).
    expect((await proxy(req("/auth?error=x", { "next-action": "abc" }))).status).toBe(200);
  });

  it("conta ok passa", async () => {
    status = "ok";
    expect((await proxy(req("/api/plans/x/pdf"))).status).toBe(200);
    expect((await proxy(req("/", { "next-action": "abc" }))).status).toBe(200);
  });
});
