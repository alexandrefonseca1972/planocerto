import { describe, it, expect, vi, beforeEach } from "vitest";
import { suggest5W2H } from "@/app/actions/action-plan-ai";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/validation/sanitize", () => ({
  sanitizeText: vi.fn((v: unknown) => String(v ?? "")),
  sanitizedString: vi.fn(),
}));

vi.mock("@/lib/llm-config", () => ({
  getActiveLlmConfig: vi.fn().mockResolvedValue({
    provider: "openrouter",
    model: "anthropic/claude-3-haiku-20240307",
    apiKey: "test-key",
    baseUrl: null,
  }),
}));

vi.mock("@/lib/llm-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/llm-client")>()),
  callLlm: vi.fn(),
}));

vi.mock("@/app/actions/admin", () => ({
  checkPermission: vi.fn().mockResolvedValue(true),
}));

/** Cliente simulado com usuário logado (usado no limite de chamadas por usuário). */
function withAuth<T extends object>(client: T) {
  return { ...client, auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) } };
}

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
    vi.mocked(createClient).mockResolvedValue(withAuth(mockSupabase) as never);

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
    vi.mocked(createClient).mockResolvedValue(withAuth(mockSupabase) as never);

    const result = await suggest5W2H("Implement sales training", VALID_PLAN_ID);

    expect(result.why).toBe("Test Why");

    const { callLlm } = await import("@/lib/llm-client");
    const callArgs = vi.mocked(callLlm).mock.calls[0];
    const prompt = callArgs[0][0].content as string;
    expect(prompt).not.toContain("CONTEXTO REGIONAL DA UNIDADE");
  });
});

describe("suggest5W2H — travas de segurança e custo", () => {
  const PLAN = "550e8400-e29b-41d4-a716-446655440000";
  const planOnly = () =>
    withAuth({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        single: vi.fn().mockResolvedValue({ data: { unit_id: null, unit: null, tenant_id: "tenant1" } }),
      })),
    });

  beforeEach(async () => {
    vi.clearAllMocks();
    const { callLlm } = await import("@/lib/llm-client");
    vi.mocked(callLlm).mockResolvedValue('Claro!\n```json\n{"why":"W","how":"H"}\n```');
    const { checkPermission } = await import("@/app/actions/admin");
    vi.mocked(checkPermission).mockResolvedValue(true);
    vi.mocked(createClient).mockResolvedValue(planOnly() as never);
  });

  it("aceita JSON dentro de bloco de código (ex.: Anthropic)", async () => {
    expect(await suggest5W2H("Implementar treinamento de vendas na unidade", PLAN)).toEqual({ why: "W", how: "H" });
  });

  it("recusa modelo fora da lista liberada", async () => {
    const r = await suggest5W2H("Implementar treinamento de vendas na unidade", PLAN, "openai/o1-pro-caro");
    expect(r.error).toBe("Modelo de IA não permitido.");
    const { callLlm } = await import("@/lib/llm-client");
    expect(callLlm).not.toHaveBeenCalled();
  });

  it("aceita o modelo configurado pelo admin", async () => {
    const r = await suggest5W2H("Implementar treinamento de vendas na unidade", PLAN, "anthropic/claude-3-haiku-20240307");
    expect(r.error).toBeUndefined();
  });

  it("exige permissão de criar/editar ações", async () => {
    const { checkPermission } = await import("@/app/actions/admin");
    vi.mocked(checkPermission).mockResolvedValue(false);
    const r = await suggest5W2H("Implementar treinamento de vendas na unidade", PLAN);
    expect(r.error).toMatch(/Permissão insuficiente/);
  });

  it("limita o tamanho da descrição", async () => {
    const r = await suggest5W2H("x".repeat(2001), PLAN);
    expect(r.error).toMatch(/no máximo 2000/);
  });
});
