import { describe, it, expect } from "vitest";

function categorizeItems(items: { status: number; planned_end?: string }[], today: string) {
  const completed = items.filter(i => i.status === 5);
  const overdue = items.filter(i => i.planned_end && i.planned_end < today && i.status !== 5);
  const progress = items.filter(i => (i.status === 3 || i.status === 4) && !overdue.includes(i));
  const pending = items.filter(i => (i.status === 1 || i.status === 2) && !overdue.includes(i));
  return { completed: completed.length, overdue: overdue.length, progress: progress.length, pending: pending.length };
}

describe("dashboard KPI calculations", () => {
  const today = "2026-05-04";

  it("counts completed items correctly", () => {
    const items = [
      { status: 5 },
      { status: 5 },
      { status: 1 },
    ];
    const result = categorizeItems(items, today);
    expect(result.completed).toBe(2);
  });

  it("overdue items are NOT counted in progress or pending", () => {
    const items = [
      { status: 3, planned_end: "2026-01-01" }, // overdue + in-progress
      { status: 2, planned_end: "2026-02-01" }, // overdue + pending
    ];
    const result = categorizeItems(items, today);
    expect(result.overdue).toBe(2);
    expect(result.progress).toBe(0);
    expect(result.pending).toBe(0);
  });

  it("in-progress items without overdue date are counted in progress", () => {
    const items = [
      { status: 4, planned_end: "2026-12-31" },
      { status: 3 },
    ];
    const result = categorizeItems(items, today);
    expect(result.progress).toBe(2);
  });

  it("pending items without overdue date are counted in pending", () => {
    const items = [
      { status: 1, planned_end: "2026-12-31" },
      { status: 2 },
    ];
    const result = categorizeItems(items, today);
    expect(result.pending).toBe(2);
  });

  it("all categories are mutually exclusive", () => {
    const items = [
      { status: 5, planned_end: "2026-01-01" },          // completed
      { status: 3, planned_end: "2026-01-01" },          // overdue
      { status: 4, planned_end: "2026-12-31" },          // progress
      { status: 1, planned_end: "2026-12-31" },          // pending
      { status: 2 },                                     // pending
      { status: 5 },                                     // completed
    ];
    const result = categorizeItems(items, today);
    const sum = result.completed + result.overdue + result.progress + result.pending;
    expect(sum).toBe(6); // total items
    expect(result.completed).toBe(2);
    expect(result.overdue).toBe(1);
    expect(result.progress).toBe(1);
    expect(result.pending).toBe(2);
  });

  it("completion rate is correct", () => {
    const items = [
      { status: 5 },
      { status: 5 },
      { status: 1 },
      { status: 4 },
    ];
    const result = categorizeItems(items, today);
    const completionRate = items.length > 0 ? Math.round((result.completed / items.length) * 100) : 0;
    expect(completionRate).toBe(50);
  });

  it("handles empty items", () => {
    const result = categorizeItems([], today);
    expect(result.completed).toBe(0);
    expect(result.overdue).toBe(0);
    expect(result.progress).toBe(0);
    expect(result.pending).toBe(0);
  });

  it("no overdue items when none have past dates", () => {
    const items = [
      { status: 3, planned_end: "2026-06-01" },
      { status: 1, planned_end: "2026-07-01" },
      { status: 2, planned_end: "2026-08-01" },
      { status: 4 },
    ];
    const result = categorizeItems(items, today);
    expect(result.overdue).toBe(0);
    expect(result.progress).toBe(2);
    expect(result.pending).toBe(2);
  });
});
