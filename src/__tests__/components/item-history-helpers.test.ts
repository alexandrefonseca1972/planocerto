import { describe, expect, it } from "vitest";
import { formatAuditEntryDate, getAuditEntryMarker, getAuditEntrySummary, getAuditEntryTone } from "@/components/planos/item-history-helpers";
import type { AuditEntry } from "@/types/action-plan";

function makeEntry(action: string, snapshot: Record<string, unknown> = {}): AuditEntry {
  return {
    id: "audit-1",
    plan_id: "plan-1",
    item_id: "item-1",
    action,
    snapshot,
    user_id: "user-1",
    user_name: "Tester",
    created_at: "2026-05-13T21:00:00.000Z",
  };
}

describe("item-history-helpers", () => {
  it("formats create and delete markers and tones", () => {
    expect(getAuditEntryMarker("CREATE_ITEM")).toBe("+");
    expect(getAuditEntryMarker("DELETE_ITEM")).toBe("−");
    expect(getAuditEntryTone("CREATE_ITEM")).toContain("emerald");
    expect(getAuditEntryTone("DELETE_ITEM")).toContain("red");
  });

  it("summarizes status-only updates as farol recalculation", () => {
    expect(getAuditEntrySummary(makeEntry("UPDATE_ITEM", { status: 5 }))).toBe("Farol recalculado");
  });

  it("summarizes date updates as schedule update", () => {
    expect(getAuditEntrySummary(makeEntry("UPDATE_ITEM", { planned_end: "2026-05-20" }))).toBe("Cronograma atualizado");
  });

  it("formats timestamp for pt-BR output", () => {
    expect(formatAuditEntryDate("2026-05-13T21:00:00.000Z")).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
