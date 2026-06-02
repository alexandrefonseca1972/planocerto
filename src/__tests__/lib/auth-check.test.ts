import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";

// Estado compartilhado e spies do logger, içados acima dos vi.mock.
const h = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  state: { result: null as unknown },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    child: () => ({
      warn: h.warn,
      debug: h.debug,
      info: vi.fn(),
      error: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
    }),
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => h.state.result },
  }),
}));

vi.mock("next/server", () => ({
  NextResponse: { next: () => ({ cookies: { set: vi.fn() } }) },
}));

import { checkAuth } from "@/lib/middleware/auth-check";

const fakeRequest = () =>
  ({ cookies: { getAll: () => [], set: vi.fn() } }) as never;

describe("checkAuth — nível de log do erro de autenticação", () => {
  beforeEach(() => {
    h.warn.mockClear();
    h.debug.mockClear();
  });

  it("requisição anônima (AuthSessionMissingError) loga em debug, não em warn", async () => {
    h.state.result = {
      data: { user: null },
      error: { name: "AuthSessionMissingError", message: "Auth session missing!" },
    };

    const { user } = await checkAuth(fakeRequest());

    expect(user).toBeNull();
    expect(h.warn).not.toHaveBeenCalled();
    expect(h.debug).toHaveBeenCalledTimes(1);
  });

  it("erro real de auth (token inválido) loga em warn, não em debug", async () => {
    h.state.result = {
      data: { user: null },
      error: { name: "AuthApiError", message: "Invalid JWT" },
    };

    await checkAuth(fakeRequest());

    expect(h.warn).toHaveBeenCalledTimes(1);
    expect(h.debug).not.toHaveBeenCalled();
  });

  it("sessão válida não loga nada", async () => {
    h.state.result = { data: { user: { id: "u1" } }, error: null };

    const { user } = await checkAuth(fakeRequest());

    expect(user).toEqual({ id: "u1" });
    expect(h.warn).not.toHaveBeenCalled();
    expect(h.debug).not.toHaveBeenCalled();
  });
});
