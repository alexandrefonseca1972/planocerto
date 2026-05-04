import { describe, it, expect } from "vitest";
import { createUserSchema, updateUserSchema } from "@/lib/validations/admin";

describe("createUserSchema", () => {
  it("accepts valid user creation", () => {
    const result = createUserSchema.safeParse({
      email: "user@example.com",
      password: "StrongP@ss1",
      name: "Test User",
      role: "user",
    });
    expect(result.success).toBe(true);
    expect(result.data?.role).toBe("user");
  });

  it("accepts admin role (blocked at action level)", () => {
    const result = createUserSchema.safeParse({
      email: "admin@example.com",
      password: "StrongP@ss1",
      name: "Admin User",
      role: "admin",
    });
    expect(result.success).toBe(true);
    expect(result.data?.role).toBe("admin");
  });

  it("rejects invalid role", () => {
    const result = createUserSchema.safeParse({
      email: "user@example.com",
      password: "StrongP@ss1",
      name: "Test",
      role: "super_admin",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = createUserSchema.safeParse({
      email: "user@example.com",
      password: "abc",
      name: "Test",
      role: "user",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateUserSchema", () => {
  it("accepts valid update", () => {
    const result = updateUserSchema.safeParse({
      name: "Updated Name",
      role: "user",
    });
    expect(result.success).toBe(true);
  });

  it("accepts admin role update", () => {
    const result = updateUserSchema.safeParse({
      name: "Admin",
      role: "admin",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short name", () => {
    const result = updateUserSchema.safeParse({
      name: "A",
      role: "user",
    });
    expect(result.success).toBe(false);
  });
});
