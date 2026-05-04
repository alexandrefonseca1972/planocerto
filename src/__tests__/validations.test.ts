import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, profileSchema, resetSchema, updatePasswordSchema } from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "123456" });
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "123456" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({ email: "notanemail", password: "123456" });
    expect(result.success).toBe(false);
  });

  it("lowercases the email", () => {
    const result = loginSchema.safeParse({ email: "Test@Example.COM", password: "123456" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("test@example.com");
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "John Doe",
    email: "john@example.com",
    password: "Abc123@!",
    confirmPassword: "Abc123@!",
  };

  it("accepts valid data", () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects short name", () => {
    const result = registerSchema.safeParse({ ...valid, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (no uppercase)", () => {
    const result = registerSchema.safeParse({ ...valid, password: "abc123@!", confirmPassword: "abc123@!" });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (no lowercase)", () => {
    const result = registerSchema.safeParse({ ...valid, password: "ABC123@!", confirmPassword: "ABC123@!" });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (no number)", () => {
    const result = registerSchema.safeParse({ ...valid, password: "Abcdef@!", confirmPassword: "Abcdef@!" });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (no special char)", () => {
    const result = registerSchema.safeParse({ ...valid, password: "Abc12345", confirmPassword: "Abc12345" });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "Different@1" });
    expect(result.success).toBe(false);
  });

  it("rejects password under 8 chars", () => {
    const result = registerSchema.safeParse({ ...valid, password: "Ab1@", confirmPassword: "Ab1@" });
    expect(result.success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("accepts valid name", () => {
    const result = profileSchema.safeParse({ name: "John" });
    expect(result.success).toBe(true);
  });

  it("rejects short name", () => {
    const result = profileSchema.safeParse({ name: "J" });
    expect(result.success).toBe(false);
  });
});

describe("resetSchema", () => {
  it("accepts valid email", () => {
    const result = resetSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = resetSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = resetSchema.safeParse({ email: "notanemail" });
    expect(result.success).toBe(false);
  });

  it("lowercases the email", () => {
    const result = resetSchema.safeParse({ email: "USER@Example.COM" });
    expect(result.data?.email).toBe("user@example.com");
  });
});

describe("updatePasswordSchema", () => {
  it("accepts valid password pair", () => {
    const result = updatePasswordSchema.safeParse({
      password: "StrongP@ss1",
      confirmPassword: "StrongP@ss1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password", () => {
    const result = updatePasswordSchema.safeParse({
      password: "Abc1@",
      confirmPassword: "Abc1@",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = updatePasswordSchema.safeParse({
      password: "strongp@ss1",
      confirmPassword: "strongp@ss1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = updatePasswordSchema.safeParse({
      password: "StrongP@ss",
      confirmPassword: "StrongP@ss",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without special char", () => {
    const result = updatePasswordSchema.safeParse({
      password: "StrongPass1",
      confirmPassword: "StrongPass1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = updatePasswordSchema.safeParse({
      password: "StrongP@ss1",
      confirmPassword: "Different1@",
    });
    expect(result.success).toBe(false);
  });
});
