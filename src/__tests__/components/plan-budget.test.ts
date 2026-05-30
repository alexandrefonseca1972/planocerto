import { describe, it, expect } from "vitest";
import { calculatePlanFinancials } from "@/components/planos/plan-utils";
import type { ActionItem } from "@/types/action-plan";

describe("calculatePlanFinancials", () => {
  const mockItems: ActionItem[] = [
    { preco: 100, children: [{ preco: 50 }] } as unknown as ActionItem,
    { preco: 200 } as unknown as ActionItem,
  ];

  it("should calculate total cost correctly including nested items", () => {
    const { totalCost } = calculatePlanFinancials(mockItems);
    expect(totalCost).toBe(350);
  });

  it("should detect over budget correctly", () => {
    const { isOverBudget, percentUsed } = calculatePlanFinancials(mockItems, 300);
    expect(isOverBudget).toBe(true);
    expect(percentUsed).toBe((350 / 300) * 100);
  });

  it("should detect within budget correctly", () => {
    const { isOverBudget, percentUsed } = calculatePlanFinancials(mockItems, 400);
    expect(isOverBudget).toBe(false);
    expect(percentUsed).toBe((350 / 400) * 100);
  });

  it("should return 0 percent if budget is 0 or undefined", () => {
    const { percentUsed } = calculatePlanFinancials(mockItems, 0);
    expect(percentUsed).toBe(0);
  });

  it("should handle items without price", () => {
    const itemsWithoutPrice = [{ action: "No price" } as unknown as ActionItem];
    const { totalCost } = calculatePlanFinancials(itemsWithoutPrice);
    expect(totalCost).toBe(0);
  });
});
