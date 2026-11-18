import { describe, it, expect, vi, beforeEach } from "vitest";

const adminDelete = vi.fn(async () => ({ error: null }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => ({ delete: () => ({ eq: adminDelete }) }) }),
}));

import { remapItemIds, insertCopiedItems } from "@/lib/plan-copy";

describe("cópia de itens de plano (achado #7)", () => {
  beforeEach(() => adminDelete.mockClear());

  it("mapeia pai mesmo quando ele vem depois do filho", () => {
    const items = [{ id: "filho", parent_id: "pai" }, { id: "pai", parent_id: null }];
    const ids = remapItemIds(items);
    expect(ids.parent("pai")).toBe(ids.id("pai"));
    expect(ids.id("filho")).not.toBe("filho");
    expect(ids.parent(null)).toBeNull();
    expect(ids.parent("fora-da-copia")).toBeNull();
  });

  it("sucesso não apaga o plano", async () => {
    const supabase = { from: () => ({ insert: async () => ({ error: null }) }) };
    expect(await insertCopiedItems(supabase as never, "p1", [{}])).toBeNull();
    expect(adminDelete).not.toHaveBeenCalled();
  });

  it("falha nos itens apaga o plano recém-criado e devolve o erro", async () => {
    const supabase = { from: () => ({ insert: async () => ({ error: { message: "violates rls" } }) }) };
    expect(await insertCopiedItems(supabase as never, "p1", [{}])).toBe("violates rls");
    expect(adminDelete).toHaveBeenCalledWith("id", "p1");
  });
});
