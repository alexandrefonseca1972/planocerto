import { describe, expect, it } from "vitest";

/**
 * Espelha as constantes/regras de createPublicLink em shared.ts.
 * Mantém o contrato de segurança: sempre expira, teto de 30 dias.
 */
const DEFAULT_PUBLIC_LINK_HOURS = 24;
const MAX_PUBLIC_LINK_HOURS = 24 * 30;

function resolvePublicLinkHours(expiresInHours?: number): number {
  const hoursRaw = expiresInHours ?? DEFAULT_PUBLIC_LINK_HOURS;
  return Math.min(
    Math.max(Number.isFinite(hoursRaw) ? Number(hoursRaw) : DEFAULT_PUBLIC_LINK_HOURS, 1),
    MAX_PUBLIC_LINK_HOURS,
  );
}

describe("public link expiry policy", () => {
  it("defaults to 24h when omitted", () => {
    expect(resolvePublicLinkHours(undefined)).toBe(24);
  });

  it("clamps zero/negative to 1h", () => {
    expect(resolvePublicLinkHours(0)).toBe(1);
    expect(resolvePublicLinkHours(-5)).toBe(1);
  });

  it("caps at 30 days", () => {
    expect(resolvePublicLinkHours(9999)).toBe(720);
    expect(resolvePublicLinkHours(720)).toBe(720);
  });

  it("accepts intermediate values", () => {
    expect(resolvePublicLinkHours(1)).toBe(1);
    expect(resolvePublicLinkHours(48)).toBe(48);
    expect(resolvePublicLinkHours(168)).toBe(168);
  });
});
