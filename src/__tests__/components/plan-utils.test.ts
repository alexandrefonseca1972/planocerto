import { describe, it, expect } from "vitest";
import { flattenItems, flattenWithStatus, fmt, trunc } from "@/components/planos/plan-utils";
import type { ActionItem } from "@/types/action-plan";

describe("plan-utils", () => {
  describe("flattenItems", () => {
    it("flattens hierarchical items with depth", () => {
      const items: ActionItem[] = [
        { id: "1", action: "A", number: "1", status: 1, children: [
          { id: "2", action: "B", number: "1.1", status: 1 },
        ]} as unknown as ActionItem,
      ];
      const flat = flattenItems(items);
      expect(flat).toHaveLength(2);
      expect(flat[0].depth).toBe(0);
      expect(flat[1].depth).toBe(1);
    });

    it("handles empty array", () => {
      expect(flattenItems([])).toHaveLength(0);
    });

    it("handles flat items", () => {
      const items: ActionItem[] = [
        { id: "1", action: "A", number: "1", status: 1 } as ActionItem,
        { id: "2", action: "B", number: "2", status: 2 } as ActionItem,
      ];
      const flat = flattenItems(items);
      expect(flat).toHaveLength(2);
      flat.forEach(i => expect(i.depth).toBe(0));
    });
  });

  describe("flattenWithStatus", () => {
    it("flattens all items without depth", () => {
      const items: ActionItem[] = [
        { id: "1", action: "A", number: "1", status: 1, children: [
          { id: "2", action: "B", number: "1.1", status: 1 },
        ]} as unknown as ActionItem,
      ];
      const flat = flattenWithStatus(items);
      expect(flat).toHaveLength(2);
    });
  });

  describe("fmt", () => {
    it("formats date to pt-BR", () => {
      const result = fmt("2026-01-15");
      expect(result).toMatch(/15\/01\/2026/);
    });
  });

  describe("trunc", () => {
    it("truncates long strings", () => {
      expect(trunc("Hello World", 5)).toBe("Hello…");
    });

    it("leaves short strings intact", () => {
      expect(trunc("Hi", 10)).toBe("Hi");
    });
  });
});
