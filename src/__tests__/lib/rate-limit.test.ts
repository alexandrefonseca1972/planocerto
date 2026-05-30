import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { rateLimit } from "@/lib/security/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("permite requisições dentro do limite e bloqueia ao exceder", () => {
    const key = `t1:${Math.random()}`;
    expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
    const fourth = rateLimit(key, 3, 60_000);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);
  });

  it("decrementa remaining a cada chamada", () => {
    const key = `t2:${Math.random()}`;
    expect(rateLimit(key, 5, 60_000).remaining).toBe(4);
    expect(rateLimit(key, 5, 60_000).remaining).toBe(3);
  });

  it("reseta a janela após o windowMs", () => {
    const key = `t3:${Math.random()}`;
    rateLimit(key, 1, 60_000);
    expect(rateLimit(key, 1, 60_000).allowed).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(rateLimit(key, 1, 60_000).allowed).toBe(true);
  });

  it("isola contadores por chave", () => {
    const a = `a:${Math.random()}`;
    const b = `b:${Math.random()}`;
    rateLimit(a, 1, 60_000);
    expect(rateLimit(a, 1, 60_000).allowed).toBe(false);
    expect(rateLimit(b, 1, 60_000).allowed).toBe(true);
  });
});
