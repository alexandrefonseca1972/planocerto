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

vi.mock("@/lib/validation/sanitize", async () =>
  (await import("@/__tests__/helpers/sanitize-mock")).sanitizeMock());

vi.mock("@/lib/errors", () => ({
  logSupabaseError: vi.fn(),
}));

vi.mock("@/lib/teams", () => ({
  notifyPlanAction: vi.fn(),
}));

import { updateItemStatus, updatePlan, upsertItem, setPlanStatus } from "@/app/actions/action-plan";

const VALID_PLAN_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("action-plan permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires plans.create when creating an item", async () => {
    checkPermissionMock.mockResolvedValue(false);

    const formData = new FormData();
    formData.set("planId", "550e8400-e29b-41d4-a716-446655440000");
    formData.set("action", "Nova acao");
    formData.set("number", "1");

    const result = await upsertItem({}, formData);

    expect(checkPermissionMock).toHaveBeenCalledWith(PERMISSIONS.PLANS_CREATE);
    expect(createClientMock).not.toHaveBeenCalled();
    expect(result).toEqual({ message: "Acesso negado. Permissão insuficiente." });
  });

  it("requires plans.update when editing an item", async () => {
    checkPermissionMock.mockResolvedValue(false);

    const formData = new FormData();
    formData.set("itemId", "550e8400-e29b-41d4-a716-446655440001");
    formData.set("planId", "550e8400-e29b-41d4-a716-446655440000");
    formData.set("action", "Acao atualizada");
    formData.set("number", "1");

    const result = await upsertItem({}, formData);

    expect(checkPermissionMock).toHaveBeenCalledWith(PERMISSIONS.PLANS_UPDATE);
    expect(createClientMock).not.toHaveBeenCalled();
    expect(result).toEqual({ message: "Acesso negado. Permissão insuficiente." });
  });

  it("requires plans.update before changing item status", async () => {
    checkPermissionMock.mockResolvedValue(false);

    const result = await updateItemStatus("550e8400-e29b-41d4-a716-446655440001", 4);

    expect(checkPermissionMock).toHaveBeenCalledWith(PERMISSIONS.PLANS_UPDATE);
    expect(createClientMock).not.toHaveBeenCalled();
    expect(result).toEqual({ message: "Acesso negado. Permissão insuficiente." });
  });

  it("persists governance fields when updating a plan", async () => {
    checkPermissionMock.mockResolvedValue(true);
    const validUnitId = "550e8400-e29b-41d4-a716-446655440099";

    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn(() => ({ eq: eqMock }));
    const fromMock = vi.fn((table: string) => {
      if (table === "action_plans") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: { tenant_id: "tenant-1" } }),
            })),
          })),
          update: updateMock,
        };
      }
      if (table === "units") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((column: string, value: string) => ({
              eq: vi.fn((_tenantColumn: string, tenantValue: string) => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: column === "id" && value === validUnitId && tenantValue === "tenant-1"
                    ? { id: validUnitId, tenant_id: "tenant-1", name: "Unidade Norte" }
                    : null,
                }),
              })),
            })),
          })),
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
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "test@example.com" } } }) },
      from: fromMock,
    });

    const formData = new FormData();
    formData.set("planId", "550e8400-e29b-41d4-a716-446655440000");
    formData.set("title", "Plano atualizado");
    formData.set("unit_id", validUnitId);
    formData.set("unit", "Unidade Norte");
    formData.set("director", "Diretora");
    formData.set("goal", "Meta 2026");
    formData.set("status", "archived");
    formData.set("exercicio", "2026");
    formData.set("budget_limit", "15000.50");
    formData.set("visibility", "restricted");

    const result = await updatePlan({}, formData);

    expect(checkPermissionMock).toHaveBeenCalledWith(PERMISSIONS.PLANS_UPDATE);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Plano atualizado",
        unit_id: validUnitId,
        unit: "Unidade Norte",
        director: "Diretora",
        goal: "Meta 2026",
        status: "archived",
        exercicio: 2026,
        budget_limit: 15000.5,
        visibility: "restricted",
        updated_at: expect.any(String),
      }),
    );
    expect(eqMock).toHaveBeenCalledWith("id", "550e8400-e29b-41d4-a716-446655440000");
    expect(result).toEqual({ success: true, message: "Plano atualizado!" });
  });
});

describe("setPlanStatus guardas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("nega quando falta a permissão plans.update", async () => {
    checkPermissionMock.mockResolvedValue(false);
    const res = await setPlanStatus(VALID_PLAN_ID, "archived");
    expect(checkPermissionMock).toHaveBeenCalledWith(PERMISSIONS.PLANS_UPDATE);
    expect(res.success).toBeUndefined();
    expect(res.message).toMatch(/Acesso negado/);
  });

  it("rejeita ID de plano inválido", async () => {
    checkPermissionMock.mockResolvedValue(true);
    const res = await setPlanStatus("nao-eh-uuid", "archived");
    expect(res.message).toMatch(/ID do plano inválido/);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("rejeita situação inválida", async () => {
    checkPermissionMock.mockResolvedValue(true);
    const res = await setPlanStatus(VALID_PLAN_ID, "lixo" as "active");
    expect(res.message).toMatch(/Situação inválida/);
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
