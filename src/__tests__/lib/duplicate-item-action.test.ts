import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERMISSIONS } from "@/lib/permissions";

const { checkPermissionMock, createClientMock } = vi.hoisted(() => ({
  checkPermissionMock: vi.fn(),
  createClientMock: vi.fn(),
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

vi.mock("@/lib/errors", () => ({
  logSupabaseError: vi.fn(),
}));

vi.mock("@/lib/teams", () => ({
  notifyPlanAction: vi.fn(),
}));

import { duplicateItem } from "@/app/actions/action-plan";

describe("duplicateItem", () => {
  const itemId = "550e8400-e29b-41d4-a716-446655440001";
  const planId = "550e8400-e29b-41d4-a716-446655440000";

  const source = {
    id: itemId,
    plan_id: planId,
    parent_id: null,
    number: "1",
    sort_order: 1,
    action: "Campanha",
    tipo_pa: "Vestibular",
    area: "",
    prioridade: "",
    subacao: "",
    como: "",
    why: "",
    where: "",
    responsible: "Ana",
    planned_start: "2026-01-01",
    planned_end: "2026-02-01",
    cost: "100",
    expected_result: "ok",
    observations: "",
    preco: 10,
    inscritos_esperado: 0,
    mat_fin_esperado: 0,
    mat_acad_esperado: 0,
    action_plans: { tenant_id: "tenant-1" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid item id", async () => {
    const result = await duplicateItem("nope");
    expect(result).toEqual({ message: "ID do item inválido." });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("requires plans.create", async () => {
    checkPermissionMock.mockResolvedValue(false);
    const fromMock = vi.fn((table: string) => {
      if (table === "action_items") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: source, error: null }),
            })),
          })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });
    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: fromMock,
    });

    const result = await duplicateItem(itemId);
    expect(checkPermissionMock).toHaveBeenCalledWith(PERMISSIONS.PLANS_CREATE, "tenant-1");
    expect(result).toEqual({ message: "Acesso negado. Permissão insuficiente." });
  });

  it("inserts a copied row when permitted", async () => {
    checkPermissionMock.mockResolvedValue(true);
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const fromMock = vi.fn((table: string) => {
      if (table === "action_items") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: source, error: null }),
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({ data: [source], error: null }),
              })),
            })),
          })),
          insert: insertMock,
        };
      }
      if (table === "plan_audit_log") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: { name: "Tester" } }),
            })),
          })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "a@b.com" } } }) },
      from: fromMock,
    });

    const result = await duplicateItem(itemId);

    expect(insertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          action: "Campanha (cópia)",
          number: "2",
          parent_id: null,
          status: 1,
          tipo_pa: "Vestibular",
          responsible: "Ana",
        }),
      ]),
    );
    expect(result).toEqual({ success: true, message: "Ação duplicada!" });
  });
});
