import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERMISSIONS } from "@/lib/permissions";

const { checkPermissionMock, createClientMock, createAdminClientMock } = vi.hoisted(() => ({
  checkPermissionMock: vi.fn(),
  createClientMock: vi.fn(),
  createAdminClientMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/app/actions/admin", () => ({
  checkPermission: checkPermissionMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/errors", () => ({
  logSupabaseError: vi.fn(),
}));

vi.mock("@/lib/teams", () => ({
  notifyPlanAction: vi.fn(),
}));

import { deleteItem } from "@/app/actions/action-plan";

describe("deleteItem", () => {
  const itemId = "550e8400-e29b-41d4-a716-446655440001";
  const childId = "550e8400-e29b-41d4-a716-446655440002";
  const planId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid id", async () => {
    const formData = new FormData();
    formData.set("itemId", "nope");
    const result = await deleteItem({}, formData);
    expect(result).toEqual({ message: "ID do item inválido." });
  });

  it("deletes the subtree with the user client when the user can update", async () => {
    checkPermissionMock
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const deleteIn = vi.fn().mockResolvedValue({ error: null, count: 2 });
    let itemSelects = 0;
    const fromMock = vi.fn((table: string) => {
      if (table === "action_items") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => {
              itemSelects += 1;
              if (itemSelects === 1) {
                return {
                  single: vi.fn().mockResolvedValue({
                    data: {
                      plan_id: planId,
                      number: "1",
                      action: "Trade (cópia)",
                      action_plans: { tenant_id: "tenant-1" },
                    },
                  }),
                };
              }
              return Promise.resolve({
                data: [
                  { id: itemId, parent_id: null },
                  { id: childId, parent_id: itemId },
                ],
              });
            }),
          })),
          delete: vi.fn(() => ({ in: deleteIn })),
        };
      }
      if (table === "plan_audit_log") return { insert: vi.fn().mockResolvedValue({ error: null }) };
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { name: "Tester" } }) })),
          })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "a@b.com" } } }) },
      from: fromMock,
    });

    const formData = new FormData();
    formData.set("itemId", itemId);
    const result = await deleteItem({}, formData);

    expect(checkPermissionMock).toHaveBeenCalledWith(PERMISSIONS.PLANS_DELETE, "tenant-1");
    expect(checkPermissionMock).toHaveBeenCalledWith(PERMISSIONS.PLANS_UPDATE, "tenant-1");
    expect(deleteIn).toHaveBeenCalledWith("id", [childId, itemId]);
    expect(result).toEqual({ success: true, message: "Item excluído!" });
  });
});
