import { describe, it, expect } from "vitest";
import { isValidUrl } from "@/lib/sanitize";

describe("isValidUrl for Teams webhooks", () => {
  it("validates Teams webhook URL", () => {
    expect(isValidUrl("https://myteam.webhook.office.com/webhookb2/abc", ["webhook.office.com", "office.com"])).toBe(true);
  });

  it("rejects non-https URL", () => {
    expect(isValidUrl("http://myteam.webhook.office.com/webhook", ["webhook.office.com"])).toBe(false);
  });

  it("rejects URL not matching allowed domain", () => {
    expect(isValidUrl("https://evil.com/webhook", ["webhook.office.com", "office.com"])).toBe(false);
  });

  it("rejects empty webhook URL", () => {
    expect(isValidUrl("", ["webhook.office.com"])).toBe(false);
  });

  it("rejects malformed URL", () => {
    expect(isValidUrl("not-a-url", ["webhook.office.com"])).toBe(false);
  });
});
