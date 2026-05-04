import { describe, it, expect } from "vitest";
import { getErrorMessage, isRetryable } from "@/lib/errors";

describe("getErrorMessage()", () => {
  it("extracts message from Error instance", () => {
    expect(getErrorMessage(new Error("test error"))).toBe("test error");
  });

  it("returns string directly", () => {
    expect(getErrorMessage("plain error")).toBe("plain error");
  });

  it("returns fallback for unknown types", () => {
    expect(getErrorMessage({})).toBe("Erro desconhecido.");
  });

  it("handles null input", () => {
    expect(getErrorMessage(null)).toBe("Erro desconhecido.");
  });

  it("handles undefined input", () => {
    expect(getErrorMessage(undefined)).toBe("Erro desconhecido.");
  });
});

describe("isRetryable()", () => {
  it("detects ECONNRESET as retryable", () => {
    expect(isRetryable(new Error("ECONNRESET"))).toBe(true);
  });

  it("detects ETIMEDOUT as retryable", () => {
    expect(isRetryable(new Error("ETIMEDOUT"))).toBe(true);
  });

  it("detects 503 status as retryable", () => {
    expect(isRetryable(new Error("503 Service Unavailable"))).toBe(true);
  });

  it("returns false for regular errors", () => {
    expect(isRetryable(new Error("Validation failed"))).toBe(false);
  });

  it("returns false for non-Error inputs", () => {
    expect(isRetryable("string")).toBe(false);
    expect(isRetryable(null)).toBe(false);
    expect(isRetryable(42)).toBe(false);
  });
});
