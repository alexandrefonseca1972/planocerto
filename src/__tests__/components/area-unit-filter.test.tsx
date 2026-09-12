import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AreaUnitFilter } from "@/components/dashboard/area-unit-filter";

const areas = [{ id: "a1", name: "Interior" }];
const units = [
  { id: "u1", name: "Campinas", area_id: "a1" },
  { id: "u2", name: "Sorocaba", area_id: "a1" },
];

describe("AreaUnitFilter", () => {
  it("multi: acumula unidades", () => {
    const onChange = vi.fn();
    render(<AreaUnitFilter areas={areas} units={units} selectedUnitIds={["u1"]} onChangeUnits={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /campinas/i }));
    fireEvent.click(screen.getByRole("option", { name: /sorocaba/i }));
    expect(onChange).toHaveBeenCalledWith(["u1", "u2"]);
  });
});
