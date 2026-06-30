import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// Carrega .env.local (mesma fonte do Next) para os testes lerem E2E_EMAIL/PASSWORD.
loadEnvConfig(process.cwd());

/**
 * E2E com Playwright. Os fluxos autenticados leem credenciais de E2E_EMAIL /
 * E2E_PASSWORD (nunca commitadas) e são pulados se ausentes — assim a suíte
 * roda em qualquer máquina sem vazar segredos. Sobe o dev server automaticamente
 * (reaproveitando um já em execução em dev).
 */
const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
