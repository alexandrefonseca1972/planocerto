import { describe, it, expect } from "vitest";
import { shouldMarkAlertSent } from "@/lib/notifications/alert-worker";

describe("shouldMarkAlertSent (idempotência de alertas)", () => {
  it("marca quando algum canal entregou, mesmo com falha parcial", () => {
    // e-mail ok + whatsapp falhou → marca (não reenvia o e-mail já entregue)
    expect(shouldMarkAlertSent(true, true)).toBe(true);
  });

  it("marca quando todos os canais entregaram", () => {
    expect(shouldMarkAlertSent(true, false)).toBe(true);
  });

  it("NÃO marca quando todos os canais falharam (deixa p/ retry, nada entregue)", () => {
    expect(shouldMarkAlertSent(false, true)).toBe(false);
  });

  it("marca quando não havia nada a enviar (sem sucesso e sem falha)", () => {
    expect(shouldMarkAlertSent(false, false)).toBe(true);
  });
});
