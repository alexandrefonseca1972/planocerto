import { describe, it, expect } from "vitest";
import { planSchema, itemSchema } from "@/lib/schemas/action-plan-schemas";

describe("planSchema", () => {
  it("accepts payload with only required title", () => {
    const data = { title: "Strategic Initiative" };
    const result = planSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects title with < 2 chars with PT-BR message", () => {
    const data = { title: "A" };
    const result = planSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("obrigatório");
    }
  });

  it("rejects title > 200 chars", () => {
    const data = { title: "A".repeat(201) };
    const result = planSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields with valid values", () => {
    const data = {
      title: "Full Plan",
      unit_id: "550e8400-e29b-41d4-a716-446655440111",
      unit: "Unit A",
      director: "John Doe",
      goal: "Increase efficiency by 20%",
      status: "archived",
      exercicio: "2026",
      budget_limit: "5000.75",
      visibility: "restricted",
    };
    const result = planSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unit_id).toBe("550e8400-e29b-41d4-a716-446655440111");
      expect(result.data.status).toBe("archived");
      expect(result.data.exercicio).toBe(2026);
      expect(result.data.budget_limit).toBe(5000.75);
      expect(result.data.visibility).toBe("restricted");
    }
  });

  it("trims whitespace from title", () => {
    const data = { title: "  Plan Title  " };
    const result = planSchema.safeParse(data);
    if (result.success) {
      expect(result.data.title).toBe("Plan Title");
    }
  });

  it("accepts empty unit_id for compatibility with hidden form field", () => {
    const result = planSchema.safeParse({ title: "Plano", unit_id: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unit_id).toBeUndefined();
    }
  });
});

describe("itemSchema", () => {
  it("accepts valid payload", () => {
    const data = {
      action: "Implement new process",
      number: "1",
      status: 1,
      sort_order: 0,
      why: "Improve efficiency",
      where: "All departments",
      responsible: "Team Lead",
    };
    const result = itemSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects status outside 1-5", () => {
    const data = {
      action: "Implement new process",
      number: "1",
      status: 10,
    };
    const result = itemSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects action with less than 3 chars", () => {
    const data = {
      action: "AB",
      number: "1",
      status: 1,
    };
    const result = itemSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("coerces sort_order string '3' to number 3", () => {
    const data = {
      action: "Task",
      number: "1",
      sort_order: "3" as unknown as number,
      status: 1,
    };
    const result = itemSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort_order).toBe(3);
      expect(typeof result.data.sort_order).toBe("number");
    }
  });

  it("defaults sort_order to 0", () => {
    const data = {
      action: "Task",
      number: "1",
      status: 1,
    };
    const result = itemSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort_order).toBe(0);
    }
  });

  it("accepts status as coerced number", () => {
    const data = {
      action: "Task",
      number: "1",
      status: "2" as unknown as number,
    };
    const result = itemSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe(2);
    }
  });

  it("accepts all optional text fields", () => {
    const data = {
      action: "Action text",
      number: "1.1",
      why: "Why text",
      where: "Where text",
      responsible: "Responsible text",
      cost: "100",
      expected_result: "Expected result text",
      actual_result: "Actual result text",
      observations: "Observations text",
      status: 1,
    };
    const result = itemSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts optional date fields", () => {
    const data = {
      action: "Task",
      number: "1",
      planned_start: "2026-06-01",
      planned_end: "2026-06-30",
      actual_start: "2026-06-01",
      actual_end: "2026-06-15",
      status: 1,
    };
    const result = itemSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("includes action error message", () => {
    const data = {
      action: "",
      number: "1",
    };
    const result = itemSchema.safeParse(data);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes("Mínimo 3"))).toBe(true);
    }
  });
});
