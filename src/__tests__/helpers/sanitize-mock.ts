import { vi } from "vitest";

/**
 * Mock compartilhado de `@/lib/validation/sanitize` para testes de server actions.
 *
 * `sanitizeText` vira passthrough e `sanitizedString` devolve um schema Zod
 * encadeável (.optional/.min/.max) — um `vi.fn()` vazio retornaria undefined e
 * quebraria os schemas montados no carregamento do módulo (companies.ts,
 * action-plan-schemas.ts). Usar via factory async do vi.mock:
 *
 *   vi.mock("@/lib/validation/sanitize", async () =>
 *     (await import("@/__tests__/helpers/sanitize-mock")).sanitizeMock());
 */
export async function sanitizeMock() {
  const { z } = await import("zod");
  return {
    sanitizeText: vi.fn((value: unknown) => String(value ?? "")),
    sanitizedString: vi.fn(
      (opts: { min?: number; max?: number; minMsg?: string; maxMsg?: string } = {}) => {
        let s = z.string();
        if (opts.min != null) s = s.min(opts.min, opts.minMsg);
        if (opts.max != null) s = s.max(opts.max, opts.maxMsg);
        return s;
      },
    ),
  };
}
