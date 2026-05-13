import { describe, it, expect, vi } from "vitest";
import { SearchInput } from "@/components/search/SearchInput";
import { render, screen, fireEvent } from "@testing-library/react";

describe("SearchInput", () => {
  it("não chama onSearch com menos de 2 caracteres", () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "a" } });
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("exibe mensagem de erro para input curto", async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "x" } });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("chama onSearch com query válida", async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "portaria" } });
    expect(onSearch).toHaveBeenCalledWith("portaria");
  });
});