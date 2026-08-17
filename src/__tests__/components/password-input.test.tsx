import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PasswordInput } from "@/components/ui/password-input";

describe("PasswordInput", () => {
  it("starts hidden and reveals the typed password", () => {
    render(<PasswordInput aria-label="Senha" defaultValue="Segredo123" />);

    const input = screen.getByLabelText("Senha") as HTMLInputElement;
    const toggle = screen.getByRole("button", { name: /mostrar senha/i });

    expect(input).toHaveAttribute("type", "password");

    fireEvent.click(toggle);

    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("Segredo123");
    expect(screen.getByRole("button", { name: /ocultar senha/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("does not let a type prop keep the field locked as password", () => {
    render(<PasswordInput aria-label="Senha" type="password" defaultValue="abc" />);

    fireEvent.click(screen.getByRole("button", { name: /mostrar senha/i }));

    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "text");
  });
});
