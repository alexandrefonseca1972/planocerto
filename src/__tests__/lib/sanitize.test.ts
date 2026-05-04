import { describe, it, expect } from "vitest";
import { sanitize, sanitizeRecord, isValidUrl } from "@/lib/sanitize";

describe("sanitize()", () => {
  it("removes angle brackets", () => {
    expect(sanitize("<script>alert('xss')</script>")).toBe("scriptalert('xss')/script");
  });

  it("preserves valid text", () => {
    expect(sanitize("Hello World! @#$%")).toBe("Hello World! @#$%");
  });

  it("handles empty string", () => {
    expect(sanitize("")).toBe("");
  });

  it("preserves text without angle brackets", () => {
    expect(sanitize("Plain text with numbers 123")).toBe("Plain text with numbers 123");
  });
});

describe("sanitizeRecord()", () => {
  it("sanitizes string values in a flat object", () => {
    const input = { name: "<b>Test</b>", age: 30 };
    const result = sanitizeRecord(input);
    expect(result.name).toBe("bTest/b");
    expect(result.age).toBe(30);
  });

  it("handles nested objects", () => {
    const input = { user: { name: "<script>xss</script>", email: "test@test.com" } };
    const result = sanitizeRecord(input);
    expect((result.user as Record<string, unknown>).name).toBe("scriptxss/script");
    expect((result.user as Record<string, unknown>).email).toBe("test@test.com");
  });

  it("preserves non-string values", () => {
    const input = { count: 42, active: true, items: [1, 2, 3] };
    const result = sanitizeRecord(input);
    expect(result).toEqual(input);
  });

  it("handles empty object", () => {
    expect(sanitizeRecord({})).toEqual({});
  });
});

describe("isValidUrl()", () => {
  it("validates HTTPS URL", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  it("rejects HTTP URL", () => {
    expect(isValidUrl("http://example.com")).toBe(false);
  });

  it("validates URL with allowed domain", () => {
    expect(isValidUrl("https://myteam.webhook.office.com/webhook/abc", ["webhook.office.com"])).toBe(true);
  });

  it("rejects URL not matching allowed domain", () => {
    expect(isValidUrl("https://evil.com/webhook", ["webhook.office.com"])).toBe(false);
  });

  it("handles invalid URL string", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  it("handles empty string", () => {
    expect(isValidUrl("")).toBe(false);
  });
});
