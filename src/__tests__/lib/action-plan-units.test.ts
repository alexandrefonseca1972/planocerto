import { describe, expect, it, vi } from "vitest";
import { findUnitForTenantByName, resolvePlanUnitDisplayName, resolvePlanUnitReference } from "@/lib/action-plan-units";

describe("findUnitForTenantByName", () => {
  it("matches unit names ignoring accents and case", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: [
                { id: "unit-1", tenant_id: "tenant-1", name: "Unidade São Luís" },
              ],
            }),
          ),
        })),
      })),
    } as never;

    const result = await findUnitForTenantByName(supabase, "tenant-1", "unidade sao luis");
    expect(result?.id).toBe("unit-1");
  });
});

describe("resolvePlanUnitReference", () => {
  it("resolves canonical name from unit id", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "unit-1", tenant_id: "tenant-1", name: "Unidade Norte" },
              }),
            })),
          })),
        })),
      })),
    } as never;

    const result = await resolvePlanUnitReference(supabase, {
      tenantId: "tenant-1",
      unitId: "unit-1",
      unitName: "qualquer",
      requireMatch: true,
    });

    expect(result).toEqual({ unitId: "unit-1", unitName: "Unidade Norte" });
  });

  it("returns error when match is required and no official unit is found", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [] })),
        })),
      })),
    } as never;

    const result = await resolvePlanUnitReference(supabase, {
      tenantId: "tenant-1",
      unitName: "Unidade Inexistente",
      requireMatch: true,
    });

    expect(result.error).toContain("unidade oficial");
    expect(result.unitId).toBeNull();
  });
});

describe("resolvePlanUnitDisplayName", () => {
  it("prefers the catalog name resolved from unit id", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "unit-1", tenant_id: "tenant-1", name: "Unidade Oficial" },
              }),
            })),
          })),
        })),
      })),
    } as never;

    const result = await resolvePlanUnitDisplayName(supabase, {
      tenantId: "tenant-1",
      unitId: "unit-1",
      unitName: "Texto Antigo",
    });

    expect(result).toBe("Unidade Oficial");
  });

  it("falls back to the stored text when the official unit cannot be resolved", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            })),
          })),
        })),
      })),
    } as never;

    const result = await resolvePlanUnitDisplayName(supabase, {
      tenantId: "tenant-1",
      unitId: "unit-missing",
      unitName: "Texto Antigo",
    });

    expect(result).toBe("Texto Antigo");
  });
});
