import { describe, expect, it } from "vitest";
import { escapeHtml } from "@/lib/escape-html";

describe("escapeHtml", () => {
  it("neutraliza tags e atributos", () => {
    expect(escapeHtml(`<img src=x onerror="alert('1')">&`)).toBe(
      "&#60;img src=x onerror=&#34;alert(&#39;1&#39;)&#34;&#62;&#38;",
    );
  });
  it("trata null/undefined/números", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(5)).toBe("5");
  });
});
