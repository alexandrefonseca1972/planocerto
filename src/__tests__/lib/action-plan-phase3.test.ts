import { describe, it, expect, vi } from "vitest";
import { bulkUpdateStatus, updateItemStatus } from "@/app/actions/action-plan";
import { createClient } from "@/lib/supabase/server";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase and permissions
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/app/actions/admin", () => ({
  checkPermission: vi.fn(() => Promise.resolve(true)),
}));

describe("Action Plan Phase 3: Mandatory Evidence", () => {
  const VALID_ITEM_ID = "550e8400-e29b-41d4-a716-446655440001";
  const VALID_PLAN_ID = "550e8400-e29b-41d4-a716-446655440000";

  type MockSupabase = {
    auth: {
      getUser: ReturnType<typeof vi.fn>;
    };
    from: ReturnType<typeof vi.fn>;
  };

  it("should block completion of HIGH priority items without evidence", async () => {
    const mockSupabase: MockSupabase = {
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "user1" } } })) },
      from: vi.fn((table) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((col) => {
          if (table === "action_items" && col === "id") {
             // We set actual_end to "2026-01-01" so deriveActionItemStatus returns 5
             return { single: () => Promise.resolve({ data: { id: VALID_ITEM_ID, plan_id: VALID_PLAN_ID, prioridade: "Alta", status: 1, action: "Test", actual_end: "2026-01-01" } }) };
          }
          if (table === "item_comments" || table === "plan_attachments") {
             return Promise.resolve({ count: 0 });
          }
          return { single: () => Promise.resolve({ data: null }) };
        })
      }))
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const result = await updateItemStatus(VALID_ITEM_ID, 5);
    expect(result.message).toContain("exigem pelo menos uma evidência");
  });

  it("should skip HIGH priority items without evidence during bulk recalculation", async () => {
    const updateEqMock = vi.fn().mockResolvedValue({ error: null });
    const mockSupabase: MockSupabase = {
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "user1" } } })) },
      from: vi.fn((table) => {
        if (table === "action_items") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [{
                id: VALID_ITEM_ID,
                plan_id: VALID_PLAN_ID,
                prioridade: "Alta",
                action: "Test",
                actual_end: "2026-01-01",
              }],
            }),
            update: vi.fn(() => ({ eq: updateEqMock })),
          };
        }

        if (table === "item_comments" || table === "plan_attachments") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ count: 0 }),
            })),
          };
        }

        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        };
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const result = await bulkUpdateStatus(VALID_PLAN_ID, [VALID_ITEM_ID], 4);

    expect(updateEqMock).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.message).toContain('mantidos fora de "Concluído"');
  });
});
