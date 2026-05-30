import { describe, it, expect, vi } from "vitest";
import { calculateSeverity } from "@/lib/correlation/engine";
import type { SocialSignal } from "@/lib/validation/schemas";

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-key",
    OPENROUTER_API_KEY: "test-key",
    APIFY_API_KEY: "test-key",
    RESEND_API_KEY: "test-key",
    ZAPI_INSTANCE_ID: "test",
    ZAPI_TOKEN: "test",
    ZAPI_CLIENT_TOKEN: "test",
    INLABS_USERNAME: "test",
    INLABS_PASSWORD: "test",
    WEBHOOK_SECRET: "test-secret-that-is-long-enough-32chars",
    CRON_SECRET: "test-secret-that-is-long-enough-32chars",
  },
}));

describe("calculateSeverity", () => {
  it("retorna critical para crise com sentimento muito negativo", () => {
    const signal = {
      entity_id: "123",
      entity_name: "Test",
      platform: "instagram" as const,
      signal_type: "crisis_alert" as const,
      mentions_count: 500,
      sentiment_score: -0.8,
      detected_at: new Date().toISOString(),
    };
    expect(calculateSeverity(signal as SocialSignal)).toBe("critical");
  });

  it("retorna high para muitas menções", () => {
    const signal = {
      entity_id: "123",
      entity_name: "Test",
      platform: "instagram" as const,
      signal_type: "mention_spike" as const,
      mentions_count: 1500,
      sentiment_score: -0.1,
      detected_at: new Date().toISOString(),
    };
    expect(calculateSeverity(signal as SocialSignal)).toBe("high");
  });

  it("retorna medium para sentimento negativo moderado", () => {
    const signal = {
      entity_id: "123",
      entity_name: "Test",
      platform: "instagram" as const,
      signal_type: "sentiment_drop" as const,
      mentions_count: 50,
      sentiment_score: -0.3,
      detected_at: new Date().toISOString(),
    };
    expect(calculateSeverity(signal as SocialSignal)).toBe("medium");
  });

  it("retorna low para sinal fraco", () => {
    const signal = {
      entity_id: "123",
      entity_name: "Test",
      platform: "instagram" as const,
      signal_type: "mention_spike" as const,
      mentions_count: 50,
      sentiment_score: 0.2,
      detected_at: new Date().toISOString(),
    };
    expect(calculateSeverity(signal as SocialSignal)).toBe("low");
  });
});