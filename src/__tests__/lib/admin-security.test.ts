import { describe, it, expect } from "vitest";
import { generateSecurePassword } from "@/lib/security/password";

describe("generateSecurePassword", () => {
  it("returns string of 16 chars by default", () => {
    const pwd = generateSecurePassword();
    expect(pwd).toHaveLength(16);
  });

  it("returns string of N chars when N passed", () => {
    expect(generateSecurePassword(20)).toHaveLength(20);
    expect(generateSecurePassword(32)).toHaveLength(32);
    expect(generateSecurePassword(8)).toHaveLength(8);
  });

  it("contains at least 1 uppercase letter", () => {
    const pwd = generateSecurePassword();
    expect(/[A-Z]/.test(pwd)).toBe(true);
  });

  it("contains at least 1 lowercase letter", () => {
    const pwd = generateSecurePassword();
    expect(/[a-z]/.test(pwd)).toBe(true);
  });

  it("contains at least 1 digit", () => {
    const pwd = generateSecurePassword();
    expect(/[0-9]/.test(pwd)).toBe(true);
  });

  it("contains at least 1 special character from !@#$%&*", () => {
    const pwd = generateSecurePassword();
    expect(/[!@#$%&*]/.test(pwd)).toBe(true);
  });

  it("generates different passwords on consecutive calls", () => {
    const pwd1 = generateSecurePassword();
    const pwd2 = generateSecurePassword();
    expect(pwd1).not.toBe(pwd2);
  });

  it("only uses allowed character sets", () => {
    const pwd = generateSecurePassword();
    const allowedChars = /^[A-Za-z0-9!@#$%&*]+$/;
    expect(allowedChars.test(pwd)).toBe(true);
  });

  it("meets complexity requirements for longer passwords", () => {
    // Test multiple times to ensure consistency
    for (let i = 0; i < 10; i++) {
      const pwd = generateSecurePassword(32);
      expect(/[A-Z]/.test(pwd)).toBe(true);
      expect(/[a-z]/.test(pwd)).toBe(true);
      expect(/[0-9]/.test(pwd)).toBe(true);
      expect(/[!@#$%&*]/.test(pwd)).toBe(true);
    }
  });
});
