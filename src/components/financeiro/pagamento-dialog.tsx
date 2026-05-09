"use client";

import { useActionState, useCallback, useEffect, useMemo } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BRLInput } from "@/components/ui/brl-input";
import { FormDialog } from "@/components/ui/form-dialog";
import { useToast } from "@/components/ui/toast";
import { useLiveValidation } from "@/lib/hooks/use-live-validation";
import { registrarPagamento } from "@/app/actions/contas-pagar";
import { pagamentoSchema } from "@/lib/schemas/financeiro-schemas";
import { FORMAS_PAGAMENTO, FORMA_PAGAMENTO_LABELS } from "@/types/financeiro";
import type {
  FinanceFormState,
  FormaPagamento,
  ParcelaPagar,
} from "@/types/financeiro";
import { formatBRL, formatDateBR } from "@/lib/format-br";

const init: FinanceFormState = { message: undefined, errors: {} };

interface FormValues {
  parcela_id: string;
  data_pagamento: string;
  valor_pago: number;
  forma_pagamento: FormaPagamento;
  observacoes: string;
}

export function PagamentoDialog({
  parcela,
  open,
  onClose,
  onSuccess,
}: {
  parcela: ParcelaPagar | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [state, action, isSaving] = useActionState(registrarPagamento, init);

  const initial: FormValues = useMemo(
    () => ({
      parcela_id: parcela?.id ?? "",
      data_pagamento:
        parcela?.data_pagamento || new Date().toISOString().slice(0, 10),
      valor_pago: Number(parcela?.valor_pago ?? parcela?.valor ?? 0),
      forma_pagamento:
        (parcela?.forma_pagamento as FormaPagamento) || "pix",
      observacoes: parcela?.observacoes || "",
    }),
    [parcela],
  );

  const {
    values,
    setValue: setValueBase,
    errors,
    markTouched,
    isValid,
    isDirty,
    validateAll,
    reset,
  } = useLiveValidation<FormValues>(pagamentoSchema, initial);

  const setValue = useCallback(
    <K extends keyof FormValues>(name: K, value: FormValues[K]) => {
      setValueBase(name, value);
      markTouched(name as string);
    },
    [setValueBase, markTouched],
  );

  useEffect(() => {
    if (open) reset(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parcela?.id]);

  useEffect(() => {
     
    if (state.success) {
      toast(state.message || "Pagamento registrado!");
      onSuccess?.();
      onClose();
    } else if (state.message && !state.success) {
      toast(state.message, "error");
    }
     
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function submit() {
    if (!validateAll()) return;
    const fd = new FormData();
    fd.set("parcela_id", values.parcela_id);
    fd.set("data_pagamento", values.data_pagamento);
    fd.set("valor_pago", String(values.valor_pago));
    fd.set("forma_pagamento", values.forma_pagamento);
    fd.set("observacoes", values.observacoes);
    action(fd);
  }

  if (!open || !parcela) return null;

  return (
    <FormDialog
      open
      title={`Registrar pagamento — Parcela ${parcela.numero}`}
      subtitle={`Vencimento: ${formatDateBR(parcela.data_vencimento)} • Valor: ${formatBRL(parcela.valor)}`}
      isDirty={isDirty}
      onClose={onClose}
      onSubmit={submit}
      isSaving={isSaving}
      canSave={isValid}
      serverError={!state.success ? state.message : undefined}
      submitLabel="Registrar pagamento"
      size="md"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          id="pag-data"
          label="Data do pagamento"
          required
          error={errors.data_pagamento}
        >
          <Input
            id="pag-data"
            type="date"
            value={values.data_pagamento}
            onChange={(e) => setValue("data_pagamento", e.target.value)}
            onBlur={() => markTouched("data_pagamento")}
            aria-invalid={Boolean(errors.data_pagamento)}
          />
        </Field>

        <Field
          id="pag-valor"
          label="Valor pago"
          required
          error={errors.valor_pago}
        >
          <BRLInput
            id="pag-valor"
            value={values.valor_pago}
            onChange={(next) => setValue("valor_pago", next)}
            onBlur={() => markTouched("valor_pago")}
            className="text-right tabular-nums"
            aria-invalid={Boolean(errors.valor_pago)}
          />
        </Field>
      </div>

      <Field
        id="pag-forma"
        label="Forma de pagamento"
        required
        error={errors.forma_pagamento}
      >
        <Select
          id="pag-forma"
          value={values.forma_pagamento}
          onChange={(e) =>
            setValue("forma_pagamento", e.target.value as FormaPagamento)
          }
        >
          {FORMAS_PAGAMENTO.map((f) => (
            <option key={f} value={f}>
              {FORMA_PAGAMENTO_LABELS[f]}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        id="pag-obs"
        label="Observações"
        helpText="Comprovante, número da transação, banco..."
        maxLength={500}
        value={values.observacoes}
        error={errors.observacoes}
      >
        <textarea
          id="pag-obs"
          rows={2}
          maxLength={500}
          value={values.observacoes}
          onChange={(e) => setValue("observacoes", e.target.value)}
          onBlur={() => markTouched("observacoes")}
          className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 resize-none"
          placeholder="Anotações sobre este pagamento..."
        />
      </Field>
    </FormDialog>
  );
}
