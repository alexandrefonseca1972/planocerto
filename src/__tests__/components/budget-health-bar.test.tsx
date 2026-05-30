import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BudgetHealthBar } from "@/components/planos/budget-health-bar";

describe("BudgetHealthBar", () => {
  it("retorna null quando budgetLimit <= 0", () => {
    const { container } = render(
      <BudgetHealthBar totalCost={100} budgetLimit={0} isOverBudget={false} percentUsed={0} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("mostra badge de orçamento estourado quando isOverBudget", () => {
    render(
      <BudgetHealthBar totalCost={1200} budgetLimit={1000} isOverBudget={true} percentUsed={120} />,
    );
    expect(screen.getByText(/orçamento estourado/i)).toBeInTheDocument();
  });

  it("mostra saldo disponível quando dentro do orçamento", () => {
    render(
      <BudgetHealthBar totalCost={400} budgetLimit={1000} isOverBudget={false} percentUsed={40} />,
    );
    expect(screen.getByText(/saldo disponível/i)).toBeInTheDocument();
    // 1000 - 400 = 600 formatado em BRL
    expect(screen.getByText(/600/)).toBeInTheDocument();
  });

  it("não mostra saldo disponível quando estourado", () => {
    render(
      <BudgetHealthBar totalCost={1200} budgetLimit={1000} isOverBudget={true} percentUsed={120} />,
    );
    expect(screen.queryByText(/saldo disponível/i)).not.toBeInTheDocument();
  });

  it("exibe o percentual usado arredondado", () => {
    render(
      <BudgetHealthBar totalCost={336} budgetLimit={400} isOverBudget={false} percentUsed={84.2} />,
    );
    expect(screen.getByText(/84%/)).toBeInTheDocument();
  });
});
