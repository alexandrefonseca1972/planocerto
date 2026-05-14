import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PlanFilters } from "@/components/planos/plan-filters";

describe("PlanFilters", () => {
  const mockProps = {
    searchQuery: "",
    setSearchQuery: vi.fn(),
    statusFilter: null,
    setStatusFilter: vi.fn(),
    planStatusFilter: null,
    setPlanStatusFilter: vi.fn(),
    visibilityFilter: null,
    setVisibilityFilter: vi.fn(),
    exercicioFilter: null,
    setExercicioFilter: vi.fn(),
    availableExercises: [2026, 2025],
    filteredCount: 5,
    totalCount: 10,
    filteredPlanCount: 2,
    totalPlanCount: 4,
  };

  it("should render search input and status buttons", () => {
    render(<PlanFilters {...mockProps} />);
    
    expect(screen.getByPlaceholderText(/buscar ações/i)).toBeInTheDocument();
    expect(screen.getByText(/Não Iniciada/i)).toBeInTheDocument();
    expect(screen.getByText(/Pendente/i)).toBeInTheDocument();
    
    // "Em andamento" and "Em andamento (atraso)" both contain "Em andamento"
    const emAndamentoElements = screen.getAllByText(/Em andamento/i);
    expect(emAndamentoElements.length).toBe(2);
    
    expect(screen.getByText(/Concluído/i)).toBeInTheDocument();
  });

  it("should call setSearchQuery on input change", () => {
    render(<PlanFilters {...mockProps} />);
    const input = screen.getByPlaceholderText(/buscar ações/i);
    
    fireEvent.change(input, { target: { value: "teste" } });
    expect(mockProps.setSearchQuery).toHaveBeenCalledWith("teste");
  });

  it("should call setStatusFilter when clicking a status button", () => {
    render(<PlanFilters {...mockProps} />);
    const button = screen.getByText(/concluído/i);
    
    fireEvent.click(button);
    expect(mockProps.setStatusFilter).toHaveBeenCalledWith(5);
  });

  it("should show filtered count when filters are active", () => {
    render(<PlanFilters {...mockProps} searchQuery="algo" />);
    expect(screen.getByText(/5 de 10/i)).toBeInTheDocument();
  });

  it("should render governance filters", () => {
    render(<PlanFilters {...mockProps} />);

    expect(screen.getByLabelText(/situação do plano/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/visibilidade do plano/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/exercício do plano/i)).toBeInTheDocument();
  });

  it("should call plan governance setters", () => {
    render(<PlanFilters {...mockProps} />);

    fireEvent.change(screen.getByLabelText(/situação do plano/i), { target: { value: "archived" } });
    fireEvent.change(screen.getByLabelText(/visibilidade do plano/i), { target: { value: "restricted" } });
    fireEvent.change(screen.getByLabelText(/exercício do plano/i), { target: { value: "2026" } });

    expect(mockProps.setPlanStatusFilter).toHaveBeenCalledWith("archived");
    expect(mockProps.setVisibilityFilter).toHaveBeenCalledWith("restricted");
    expect(mockProps.setExercicioFilter).toHaveBeenCalledWith(2026);
  });
});
