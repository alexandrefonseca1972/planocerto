import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DateRangePicker } from "@/components/ui/date-range-picker";

describe("DateRangePicker", () => {
  it("mostra o placeholder quando não há intervalo e abre o calendário", () => {
    render(<DateRangePicker from="" to="" onChange={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: /Período/i });
    expect(trigger).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: /intervalo de datas/i })).toBeInTheDocument();
  });

  it("exibe o intervalo formatado (dd/mm/aaaa – dd/mm/aaaa)", () => {
    render(<DateRangePicker from="2026-01-01" to="2026-03-01" onChange={vi.fn()} />);
    expect(screen.getByText("01/01/2026 – 01/03/2026")).toBeInTheDocument();
  });

  it("seleciona início e fim e dispara onChange com (from, to) ISO", () => {
    const onChange = vi.fn();
    render(<DateRangePicker from="" to="" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Período/i }));
    const dialog = screen.getByRole("dialog");
    // Sem datas → o popover abre no mês atual. Clica dia 10 (início) e 20 (fim).
    const now = new Date();
    const y = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    fireEvent.click(within(dialog).getByRole("button", { name: `10/${mm}/${y}` }));
    fireEvent.click(within(dialog).getByRole("button", { name: `20/${mm}/${y}` }));
    expect(onChange).toHaveBeenCalledWith(`${y}-${mm}-10`, `${y}-${mm}-20`);
  });

  it("limpa o intervalo via botão X chamando onChange('', '')", () => {
    const onChange = vi.fn();
    render(<DateRangePicker from="2026-06-01" to="2026-06-30" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Limpar intervalo de datas/i }));
    expect(onChange).toHaveBeenCalledWith("", "");
  });

  it("aplica o preset 'Este ano' como 1º de janeiro a 31 de dezembro", () => {
    const onChange = vi.fn();
    render(<DateRangePicker from="" to="" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Período/i }));
    fireEvent.click(screen.getByRole("button", { name: /Este ano/i }));
    const year = new Date().getFullYear();
    expect(onChange).toHaveBeenCalledWith(`${year}-01-01`, `${year}-12-31`);
  });
});
