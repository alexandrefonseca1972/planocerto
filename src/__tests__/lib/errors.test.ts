import { describe, it, expect, beforeEach, vi } from "vitest";
import { getErrorMessage, isRetryable, logSupabaseError } from "@/lib/errors";

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

  it("detects retryable markers in plain strings and status objects", () => {
    expect(isRetryable("503 Service Unavailable")).toBe(true);
    expect(isRetryable({ status: 503, message: "unavailable" })).toBe(true);
  });

  it("returns false for non-retryable non-Error inputs", () => {
    expect(isRetryable("validation failed")).toBe(false);
    expect(isRetryable(null)).toBe(false);
    expect(isRetryable(42)).toBe(false);
  });
});

describe("withRetry()", () => {
  it("retries retryable failures and eventually succeeds", async () => {
    const { withRetry } = await import("@/lib/errors");
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) throw new Error("503 Service Unavailable");
        return "ok";
      },
      { retries: 3, baseDelayMs: 1, sleep: async () => {} },
    );
    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("does not retry non-retryable errors", async () => {
    const { withRetry } = await import("@/lib/errors");
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts += 1;
          throw new Error("Validation failed");
        },
        { retries: 3, baseDelayMs: 1, sleep: async () => {} },
      ),
    ).rejects.toThrow("Validation failed");
    expect(attempts).toBe(1);
  });
});

describe("logSupabaseError()", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("does not throw for null or undefined error", () => {
    expect(() => logSupabaseError("test", null)).not.toThrow();
    expect(() => logSupabaseError("test", undefined)).not.toThrow();
  });

  it("calls console.error with tag and info object", () => {
    const spy = vi.spyOn(console, "error");
    const error = { code: "23505", message: "Unique constraint violated" };
    logSupabaseError("test", error);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain("test");
  });

  it("extracts known properties from error", () => {
    const spy = vi.spyOn(console, "error");
    const error = { code: "PGRST001", message: "Invalid request", details: "Bad input" };
    logSupabaseError("test", error);
    expect(spy).toHaveBeenCalled();
  });

  it("falls back to JSON.stringify for unknown structure", () => {
    const spy = vi.spyOn(console, "error");
    const error = { customProp: "value" };
    logSupabaseError("test", error);
    expect(spy).toHaveBeenCalled();
  });

  it("falls back to String() when JSON.stringify fails", () => {
    const spy = vi.spyOn(console, "error");
    const circular: { x: number; self?: unknown } = { x: 1 };
    circular.self = circular;
    logSupabaseError("test", circular);
    expect(spy).toHaveBeenCalled();
  });

  it("includes message and details in separate logs", () => {
    const spy = vi.spyOn(console, "error");
    const error = { message: "Test message", details: "Test details" };
    logSupabaseError("test", error);
    const calls = spy.mock.calls.map(call => call.join(" "));
    expect(calls.some(c => c.includes("Message"))).toBe(true);
    expect(calls.some(c => c.includes("Details"))).toBe(true);
  });
});
