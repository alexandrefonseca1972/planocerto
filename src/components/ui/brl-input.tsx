"use client";

import { type InputHTMLAttributes, forwardRef } from "react";
import { Input } from "@/components/ui/input";

type BRLInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "inputMode"
> & {
  value: number;
  onChange: (next: number) => void;
};

/**
 * Input formatado em moeda brasileira (R$ 1.234,56).
 *
 * O usuário digita dígitos contínuos — o componente interpreta como centavos
 * e atualiza o valor numérico no callback. A representação visual sempre
 * reflete o valor canônico, evitando estados intermediários como "1,5,0,0".
 */
function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const reais = Math.floor(abs / 100);
  const cs = abs % 100;
  const reaisFmt = reais.toLocaleString("pt-BR");
  return `${sign}R$ ${reaisFmt},${cs.toString().padStart(2, "0")}`;
}

export const BRLInput = forwardRef<HTMLInputElement, BRLInputProps>(
  ({ value, onChange, className, ...rest }, ref) => {
    const cents = Math.round((Number.isFinite(value) ? value : 0) * 100);
    const display = formatCents(cents);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const onlyDigits = e.target.value.replace(/\D/g, "");
      const next = onlyDigits === "" ? 0 : parseInt(onlyDigits, 10);
      onChange(next / 100);
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        className={className}
        {...rest}
      />
    );
  },
);

BRLInput.displayName = "BRLInput";
