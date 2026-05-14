import { describe, it, expect, vi, beforeEach } from "vitest";
import { suggest5W2H } from "@/app/actions/action-plan-ai";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/app/actions/_catalog-utils", () => ({
  sanitizeText: vi.fn(async (v) => String(v)),
}));

describe("suggest5W2H with Regional Context", () => {
  type FetchMock = ReturnType<typeof vi.fn>;
  type MockSupabase = {
    from: ReturnType<typeof vi.fn>;
  };

  let mockSupabase: MockSupabase;
  const VALID_PLAN_ID = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
    // Global fetch mock for OpenRouter
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({ why: "Test Why", how: "Test How" }) } }]
      })
    });
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
                area: { name: "Area X", regional_context: { regionalidade: "Culture X" } }
              }
            });
          }
          return Promise.resolve({ data: null });
        }),
        single: vi.fn().mockImplementation(() => {
          if (table === "action_plans") {
            return Promise.resolve({ data: { unit_id: "unit-1", unit: "Unit A", tenant_id: "tenant1" } });
          }
          return Promise.resolve({ data: null });
        })
      }))
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const result = await suggest5W2H("Implement sales training", VALID_PLAN_ID);

    expect(mockSupabase.from).toHaveBeenCalledWith("action_plans");
    expect(mockSupabase.from).toHaveBeenCalledWith("units");
    
    // Check if fetch was called with a prompt containing the regional context
    const fetchCall = (global.fetch as FetchMock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    const prompt = body.messages[0].content;
    
    expect(prompt).toContain("CONTEXTO REGIONAL DA UNIDADE (Unit A)");
    expect(prompt).toContain("Students A");
    expect(prompt).toContain("Culture X");
    expect(result.why).toBe("Test Why");
  });

  it("should work even without regional context (graceful fallback)", async () => {
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        single: vi.fn().mockResolvedValue({ data: null })
      }))
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const result = await suggest5W2H("Implement sales training", VALID_PLAN_ID);
    
    expect(result.why).toBe("Test Why");
    const fetchCall = (global.fetch as FetchMock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    const prompt = body.messages[0].content;
    expect(prompt).not.toContain("CONTEXTO REGIONAL DA UNIDADE");
  });
});
