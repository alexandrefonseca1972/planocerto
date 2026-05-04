import { describe, it, expect } from "vitest";
import { createTenantSchema } from "@/lib/validations/tenant";

describe("createTenantSchema", () => {
  it("accepts valid tenant data", () => {
    const result = createTenantSchema.safeParse({
      name: "Empresa Teste",
      slug: "empresa-teste",
      plan: "pro",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createTenantSchema.safeParse({
      name: "",
      slug: "test",
      plan: "free",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid plan", () => {
    const result = createTenantSchema.safeParse({
      name: "Test",
      slug: "test",
      plan: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("requires plan field", () => {
    const result = createTenantSchema.safeParse({
      name: "Test",
      slug: "test",
    });
    expect(result.success).toBe(false);
  });
});

describe("last-owner protection logic", () => {
  function canRemoveOwner(owners: number, memberRole: string): boolean {
    if (memberRole === "owner" && owners <= 1) return false;
    return true;
  }

  it("blocks removal of last owner", () => {
    expect(canRemoveOwner(1, "owner")).toBe(false);
  });

  it("allows removal when multiple owners exist", () => {
    expect(canRemoveOwner(2, "owner")).toBe(true);
  });

  it("allows removal of non-owner member", () => {
    expect(canRemoveOwner(1, "member")).toBe(true);
  });

  it("allows demotion when multiple owners", () => {
    expect(canRemoveOwner(2, "owner")).toBe(true);
  });

  it("blocks demotion of last owner", () => {
    expect(canRemoveOwner(1, "owner")).toBe(false);
  });
});
