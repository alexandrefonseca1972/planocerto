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

vi.mock("@/app/actions/_catalog-utils", () => ({
  sanitizeText: vi.fn(async (value: unknown) => String(value ?? "")),
}));

vi.mock("@/lib/errors", () => ({
  logSupabaseError: vi.fn(),
}));

vi.mock("@/lib/teams", () => ({
  notifyPlanAction: vi.fn(),
}));

import { updateItemStatus, upsertItem } from "@/app/actions/action-plan";

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
});
