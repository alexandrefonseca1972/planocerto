import { describe, it, expect, vi, beforeEach } from "vitest";
import { suggest5W2H } from "@/app/actions/action-plan-ai";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/validation/sanitize", async () => {
  const { z } = await import("zod");
  return {
    sanitizeText: vi.fn((v: unknown) => String(v ?? "")),
    // Devolve um schema Zod encadeável (.optional/.min/.max) — o vi.fn() vazio
    // retornava undefined e quebrava os schemas montados no load do módulo.
    sanitizedString: vi.fn(
      (opts: { min?: number; max?: number; minMsg?: string; maxMsg?: string } = {}) => {
        let s = z.string();
        if (opts.min != null) s = s.min(opts.min, opts.minMsg);
        if (opts.max != null) s = s.max(opts.max, opts.maxMsg);
        return s;
      },
    ),
  };
});

vi.mock("@/app/actions/llm-settings", () => ({
  getActiveLlmConfig: vi.fn().mockResolvedValue({
    provider: "openrouter",
    model: "anthropic/claude-3-haiku-20240307",
    apiKey: "test-key",
    baseUrl: null,
  }),
}));

vi.mock("@/lib/llm-client", () => ({
  callLlm: vi.fn(),
  PROVIDERS: {},
  PROVIDER_MODELS: {},
}));

describe("suggest5W2H with Regional Context", () => {
  type MockSupabase = {
    from: ReturnType<typeof vi.fn>;
  };

  let mockSupabase: MockSupabase;
  const VALID_PLAN_ID = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(async () => {
    vi.clearAllMocks();

    const { callLlm } = await import("@/lib/llm-client");
    vi.mocked(callLlm).mockResolvedValue(
      JSON.stringify({ why: "Test Why", how: "Test How" }),
    );
  });

  it("should fetch regional context and include it in the prompt", async () => {
    mockSupabase = {
      from: vi.fn((table) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(() => {
          if (table === "units") {
            return Promise.resolve({
              data: {
                name: "Unit A",
                regional_context: { perfil_persona: "Students A" },
                area: { name: "Area X", regional_context: { regionalidade: "Culture X" } },
              },
            });
          }
          return Promise.resolve({ data: null });
        }),
        single: vi.fn().mockImplementation(() => {
          if (table === "action_plans") {
            return Promise.resolve({
              data: { unit_id: "unit-1", unit: "Unit A", tenant_id: "tenant1" },
            });
          }
          return Promise.resolve({ data: null });
        }),
      })),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const result = await suggest5W2H("Implement sales training", VALID_PLAN_ID);

    expect(mockSupabase.from).toHaveBeenCalledWith("action_plans");
    expect(mockSupabase.from).toHaveBeenCalledWith("units");

    const { callLlm } = await import("@/lib/llm-client");
    const callArgs = vi.mocked(callLlm).mock.calls[0];
    const prompt = callArgs[0][0].content as string;

    expect(prompt).toContain("CONTEXTO REGIONAL DA UNIDADE (Unit A)");
    expect(prompt).toContain("Students A");
    expect(prompt).toContain("Culture X");
    expect(result.why).toBe("Test Why");
  });

  it("should work even without regional context (graceful fallback)", async () => {
    mockSupabase = {
      from: vi.fn((table) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        single: vi.fn().mockImplementation(() => {
          if (table === "action_plans") {
            return Promise.resolve({
              data: { unit_id: null, unit: null, tenant_id: "tenant1" },
            });
          }
          return Promise.resolve({ data: null });
        }),
      })),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const result = await suggest5W2H("Implement sales training", VALID_PLAN_ID);

    expect(result.why).toBe("Test Why");

    const { callLlm } = await import("@/lib/llm-client");
    const callArgs = vi.mocked(callLlm).mock.calls[0];
    const prompt = callArgs[0][0].content as string;
    expect(prompt).not.toContain("CONTEXTO REGIONAL DA UNIDADE");
  });
});
