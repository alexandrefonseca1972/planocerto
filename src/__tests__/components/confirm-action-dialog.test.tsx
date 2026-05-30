import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";

function renderDialog(props: Partial<React.ComponentProps<typeof ConfirmActionDialog>> = {}) {
  const action = props.action ?? vi.fn();
  return render(
    <AlertDialog open onOpenChange={() => {}}>
      <ConfirmActionDialog
        title="Excluir item"
        msg="Tem certeza?"
        name="id"
        value="abc-123"
        action={action}
        pending={false}
        {...props}
      />
    </AlertDialog>,
  );
}

describe("ConfirmActionDialog", () => {
  it("renderiza título e mensagem", () => {
    renderDialog();
    expect(screen.getByText("Excluir item")).toBeInTheDocument();
    expect(screen.getByText("Tem certeza?")).toBeInTheDocument();
  });

  it("inclui o input hidden com name e value", () => {
    const { container } = renderDialog({ name: "plan_id", value: "xyz-9" });
    const input = container.querySelector('input[type="hidden"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    expect(input?.name).toBe("plan_id");
    expect(input?.value).toBe("xyz-9");
  });

  it("renderiza o botão de excluir", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: /excluir/i })).toBeInTheDocument();
  });
});
