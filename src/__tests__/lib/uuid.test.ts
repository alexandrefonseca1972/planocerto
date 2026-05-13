import { describe, it, expect } from "vitest";
import { isValidUuid, requireUuid } from "@/lib/validations/uuid";

describe("UUID Validation", () => {
  describe("isValidUuid", () => {
    it("returns true for valid UUID v4", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(isValidUuid(uuid)).toBe(true);
    });

    it("returns true for uppercase UUID", () => {
      const uuid = "550E8400-E29B-41D4-A716-446655440000";
      expect(isValidUuid(uuid)).toBe(true);
    });

    it("returns false for empty string", () => {
      expect(isValidUuid("")).toBe(false);
    });

    it("returns false for incomplete UUID", () => {
      expect(isValidUuid("550e8400-e29b-41d4-a716")).toBe(false);
    });

    it("returns false for SQL injection attempt", () => {
      expect(isValidUuid("'; DROP TABLE users; --")).toBe(false);
    });

    it("returns false for null", () => {
      expect(isValidUuid(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isValidUuid(undefined)).toBe(false);
    });

    it("returns false for non-string", () => {
      expect(isValidUuid(123)).toBe(false);
      expect(isValidUuid({})).toBe(false);
      expect(isValidUuid([])).toBe(false);
    });
  });

  describe("requireUuid", () => {
    it("returns value when valid", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(requireUuid(uuid)).toBe(uuid);
    });

    it("throws with custom label in message", () => {
      expect(() => requireUuid("invalid", "User ID")).toThrow("User ID inválido.");
    });

    it("throws with default ID label", () => {
      expect(() => requireUuid("invalid")).toThrow("ID inválido.");
    });

    it("throws for non-string", () => {
      expect(() => requireUuid(123)).toThrow("ID inválido.");
    });
  });
});
