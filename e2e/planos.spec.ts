import { test, expect } from "@playwright/test";
import { collectConsoleIssues, hasCreds, login } from "./helpers";

test.describe("Planos", () => {
  test.skip(!hasCreds, "Defina E2E_EMAIL e E2E_PASSWORD para rodar os fluxos autenticados.");

  test("página de planos carrega e o menu de Ações tem arquivar/reativar", async ({ page }) => {
    const { cspViolations, consoleErrors } = collectConsoleIssues(page);
    await login(page);
    await page.goto("/planos", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    const acoes = page.locator("button[title='Mais ações'], button:has-text('Ações')").first();
    await expect(acoes).toBeVisible();
    await acoes.click();
    await expect(
      page.locator("button:has-text('Arquivar plano'), button:has-text('Reativar plano')"),
    ).toBeVisible();

    expect(cspViolations).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});

test.describe("Admin no mobile", () => {
  test.skip(!hasCreds, "Defina E2E_EMAIL e E2E_PASSWORD para rodar os fluxos autenticados.");
  test.use({ viewport: { width: 375, height: 780 } });

  test("a tela de usuários não estoura a largura no mobile", async ({ page }) => {
    await login(page);
    await page.goto("/admin/users", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    // A nav do admin rola dentro do container; sem o fix, o overflow passava de 390px.
    expect(overflow).toBeLessThan(60);
  });
});
