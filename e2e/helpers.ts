import { type Page, expect } from "@playwright/test";

export const E2E_EMAIL = process.env.E2E_EMAIL || "";
export const E2E_PASSWORD = process.env.E2E_PASSWORD || "";

/** Há credenciais para os fluxos autenticados? Caso não, esses testes são pulados. */
export const hasCreds = Boolean(E2E_EMAIL && E2E_PASSWORD);

/** Faz login real e aguarda o redirect para o dashboard. */
export async function login(page: Page): Promise<void> {
  await page.goto("/auth", { waitUntil: "networkidle" });
  await page.locator("input[type=email]").first().fill(E2E_EMAIL);
  await page.locator("input[type=password]").first().fill(E2E_PASSWORD);
  await page.locator("button:has-text('Entrar')").first().click();
  await page.waitForURL("**/dashboard**", { timeout: 20_000 });
  await expect(page).toHaveURL(/\/dashboard/);
}

/** Coleta violações de CSP e erros de console emitidos pela página. */
export function collectConsoleIssues(page: Page) {
  const cspViolations: string[] = [];
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.toLowerCase().includes("content security policy")) cspViolations.push(text);
    else if (msg.type() === "error") consoleErrors.push(text);
  });
  return { cspViolations, consoleErrors };
}
