import { vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-key-anon",
    SUPABASE_SERVICE_ROLE_KEY: "test-key-service",
    OPENROUTER_API_KEY: "test-openrouter-key",
    APIFY_API_KEY: "test-apify-key",
    RESEND_API_KEY: "test-resend-key",
    ZAPI_INSTANCE_ID: "test-instance",
    ZAPI_TOKEN: "test-token",
    ZAPI_CLIENT_TOKEN: "test-client-token",
    INLABS_USERNAME: "test-user",
    INLABS_PASSWORD: "test-pass",
    WEBHOOK_SECRET: "test-webhook-secret-that-is-32chars!",
    CRON_SECRET: "test-cron-secret-that-is-32chars!",
  },
}));

function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(() => createMockLogger()),
  };
}

vi.mock("pino", () => ({
  default: vi.fn(() => createMockLogger()),
}));