import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgressGauge } from "@/components/ui/chart";

function arcs(container: HTMLElement) {
  return [...container.querySelectorAll("path")];
}

describe("ProgressGauge", () => {
  it("o arco colorido segue o mesmo semicírculo do fundo e cobre a porcentagem exata", () => {
    const { container } = render(<ProgressGauge completed={1618} total={3689} size={180} />);
    const [bg, fill] = arcs(container);
    // raio = (180 - 14) / 2 = 83; centro = 90 → de (7, 90) a (173, 90)
    expect(bg.getAttribute("d")).toBe("M 7 90 A 83 83 0 0 1 173 90");
    expect(fill.getAttribute("d")).toBe(bg.getAttribute("d"));
    const [dash, gap] = fill.getAttribute("stroke-dasharray")!.split(" ").map(Number);
    expect(dash / gap).toBeCloseTo(0.44, 5); // 44% do comprimento real do arco (π·83)
    expect(gap).toBeCloseTo(Math.PI * 83, 5);
    expect(screen.getByText("44%")).toBeTruthy();
  });

  it("0% não desenha arco colorido; 100% cobre tudo", () => {
    expect(arcs(render(<ProgressGauge completed={0} total={10} />).container)).toHaveLength(1);
    const [, full] = arcs(render(<ProgressGauge completed={10} total={10} />).container);
    const [d, g] = full.getAttribute("stroke-dasharray")!.split(" ").map(Number);
    expect(d).toBeCloseTo(g, 5);
  });
});
