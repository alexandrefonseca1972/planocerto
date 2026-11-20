import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/app/actions/auth", () => ({ login: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams() }));

import { LoginForm } from "@/components/forms/login-form";

describe("LoginForm — limpar email", () => {
  it("o X só aparece com texto, limpa o campo e mantém o foco nele", () => {
    render(<LoginForm />);
    const email = screen.getByLabelText(/email/i, { selector: "input" }) as HTMLInputElement;
    expect(screen.queryByRole("button", { name: "Limpar email" })).toBeNull();

    fireEvent.change(email, { target: { value: "alguem@exemplo.com" } });
    const clear = screen.getByRole("button", { name: "Limpar email" });
    fireEvent.click(clear);

    expect(email.value).toBe("");
    expect(document.activeElement).toBe(email);
    expect(screen.queryByRole("button", { name: "Limpar email" })).toBeNull();
  });
});
