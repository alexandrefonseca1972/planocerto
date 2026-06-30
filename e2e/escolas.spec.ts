import { test, expect } from "@playwright/test";
import { hasCreds, login } from "./helpers";

test.describe("Carteira de Escolas — geolocalização", () => {
  test.skip(!hasCreds, "Defina E2E_EMAIL e E2E_PASSWORD para rodar os fluxos autenticados.");

  test("o form de Nova Escola tem os campos de latitude e longitude", async ({ page }) => {
    await login(page);
    await page.goto("/escolas", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.locator("button:has-text('Nova Escola')").first().click();
    await expect(page.locator("input[name='latitude']")).toBeVisible();
    await expect(page.locator("input[name='longitude']")).toBeVisible();
    // Inputs numéricos com faixa de coordenada (validação do browser).
    await expect(page.locator("input[name='latitude']")).toHaveAttribute("max", "90");
    await expect(page.locator("input[name='longitude']")).toHaveAttribute("max", "180");
  });
});

test.describe("Carteira de Empresas — geolocalização", () => {
  test.skip(!hasCreds, "Defina E2E_EMAIL e E2E_PASSWORD para rodar os fluxos autenticados.");

  test("o form de Nova Empresa tem os campos de latitude e longitude", async ({ page }) => {
    await login(page);
    await page.goto("/empresas", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.locator("button:has-text('Nova Empresa')").first().click();
    await expect(page.locator("input[name='latitude']")).toBeVisible();
    await expect(page.locator("input[name='longitude']")).toBeVisible();
  });
});
