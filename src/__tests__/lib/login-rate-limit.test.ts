import { beforeEach, describe, expect, it, vi } from "vitest";

const { rateLimitMock, createClientMock } = vi.hoisted(() => ({
  rateLimitMock: vi.fn(),
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  rateLimit: rateLimitMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/auth-email", () => ({
  buildAuthEmail: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { login } from "@/app/actions/auth";

describe("login rate limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bloqueia depois de exceder o limite sem chamar o Supabase", async () => {
    rateLimitMock.mockReturnValue({ allowed: false, remaining: 0, resetAt: Date.now() });

    const formData = new FormData();
    formData.set("email", "user@example.com");
    formData.set("password", "qualquer");

    const result = await login({}, formData);

    expect(rateLimitMock).toHaveBeenCalledWith("login:user@example.com", 8, 15 * 60 * 1000);
    expect(createClientMock).not.toHaveBeenCalled();
    expect(result).toEqual({ message: "Muitas tentativas. Aguarde alguns minutos." });
  });
});
