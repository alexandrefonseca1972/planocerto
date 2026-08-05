import { test, expect } from "@playwright/test";
import { collectConsoleIssues, hasCreds, login } from "./helpers";

test.describe("Autenticação e segurança (sem login)", () => {
  test("headers de segurança presentes em /auth", async ({ page }) => {
    const res = await page.goto("/auth");
    expect(res?.status()).toBe(200);
    const headers = res!.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    // CSP estrita de script (com nonce) e estilo liberado sem nonce.
    expect(headers["content-security-policy"]).toMatch(/script-src[^;]*'nonce-/);
  });

  test("rota protegida sem sessão redireciona para /auth", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("página de login renderiza sem erros de console nem violações de CSP", async ({ page }) => {
    const { cspViolations, consoleErrors } = collectConsoleIssues(page);
    await page.goto("/auth", { waitUntil: "networkidle" });
    await expect(page.locator("input[type=email]")).toBeVisible();
    await expect(page.locator("input[type=password]")).toBeVisible();
    expect(cspViolations).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test("credenciais inválidas exibem mensagem de erro", async ({ page }) => {
    await page.goto("/auth", { waitUntil: "networkidle" });
    await page.locator("input[type=email]").first().fill("naoexiste@exemplo.com");
    await page.locator("input[type=password]").first().fill("SenhaErrada123!");
    await page.locator("button:has-text('Entrar')").first().click();
    await expect(page.locator("body")).toContainText(/inválid|incorret|credenc/i, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/auth/);
  });
});

test.describe("Fluxo autenticado", () => {
  test.skip(!hasCreds, "Defina E2E_EMAIL e E2E_PASSWORD para rodar os fluxos autenticados.");

  test("login leva ao dashboard e o token fica HttpOnly", async ({ page, context }) => {
    await login(page);

    // O cookie de auth do Supabase não pode ser legível por JS.
    const cookies = await context.cookies();
    const authCookie = cookies.find((c) => c.name.includes("auth-token") || c.name.startsWith("sb-"));
    expect(authCookie, "cookie de auth deve existir").toBeTruthy();
    expect(authCookie!.httpOnly, "cookie de auth deve ser HttpOnly").toBe(true);

    const docCookie = await page.evaluate(() => document.cookie);
    expect(docCookie).not.toContain("auth-token");
  });

  test("dashboard carrega sem violações de CSP nem erros de console", async ({ page }) => {
    const { cspViolations, consoleErrors } = collectConsoleIssues(page);
    await login(page);
    await page.waitForFunction(() => !document.body.innerText.includes("Carregando"), { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1500);
    expect(cspViolations).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
