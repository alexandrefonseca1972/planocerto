import { describe, expect, it } from "vitest";
import { buildCsp } from "@/lib/security/csp";

const NONCE = "test-nonce-123";

function directive(csp: string, name: string): string {
  return csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(name + " ")) ?? "";
}

describe("buildCsp", () => {
  it("assina script-src com o nonce e mantém 'self'", () => {
    const script = directive(buildCsp(NONCE, false), "script-src");
    expect(script).toContain(`'nonce-${NONCE}'`);
    expect(script).toContain("'self'");
  });

  it("NÃO combina nonce com unsafe-inline em style-src (senão o browser ignora o unsafe-inline)", () => {
    const style = directive(buildCsp(NONCE, false), "style-src");
    expect(style).toContain("'unsafe-inline'");
    expect(style).not.toContain("nonce-");
  });

  it("libera 'unsafe-eval' em script-src apenas no dev", () => {
    expect(directive(buildCsp(NONCE, true), "script-src")).toContain("'unsafe-eval'");
    expect(directive(buildCsp(NONCE, false), "script-src")).not.toContain("'unsafe-eval'");
  });

  it("mantém diretivas anti-clickjacking e de origem", () => {
    const csp = buildCsp(NONCE, false);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });
});
