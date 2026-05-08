"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FieldProps {
  /** Identificador único; usado para conectar label e input via htmlFor. */
  id?: string;
  /** Label visível. */
  label: ReactNode;
  /** Marca como obrigatório (asterisco vermelho). */
  required?: boolean;
  /** Texto de ajuda exibido abaixo do input. */
  helpText?: string;
  /** Mensagem de erro (substitui helpText quando presente). */
  error?: string;
  /** Para mostrar contador "12/100". Quando passado, exibe à direita do label. */
  maxLength?: number;
  /** Valor atual do campo (para o contador). */
  value?: string;
  /** Conteúdo do controle (Input, Select, Textarea…). */
  children: ReactNode;
  /** Classe extra no container. */
  className?: string;
}

/**
 * Wrapper padronizado para campos de formulário.
 * - Label em negrito + asterisco vermelho se required
 * - Contador de caracteres opcional (à direita do label)
 * - Help text ou erro abaixo do controle
 */
export function Field({
  id,
  label,
  required,
  helpText,
  error,
  maxLength,
  value = "",
  children,
  className,
}: FieldProps) {
  const showCounter = typeof maxLength === "number";
  const counterTone =
    showCounter
      ? value.length >= maxLength
        ? "text-red-600"
        : value.length / maxLength >= 0.85
        ? "text-amber-600"
        : "text-zinc-400"
      : "";
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-end justify-between gap-2">
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-red-600" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only"> (obrigatório)</span>}
        </label>
        {showCounter && (
          <span
            className={cn("shrink-0 text-[11px] tabular-nums", counterTone)}
            aria-live="polite"
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : helpText ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{helpText}</p>
      ) : null}
    </div>
  );
}

/** Conveniência para campos lado-a-lado em grid. */
export function FieldRow({
  children,
  cols = 2,
  className,
}: {
  children: ReactNode;
  cols?: 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
