"use client";

import { useActionState, useCallback, useEffect, useMemo, useState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BRLInput } from "@/components/ui/brl-input";
import { FormDialog } from "@/components/ui/form-dialog";
import { useToast } from "@/components/ui/toast";
import { useLiveValidation } from "@/lib/hooks/use-live-validation";
import {
  createConta,
  updateConta,
} from "@/app/actions/contas-pagar";
import { contaPagarSchema } from "@/lib/schemas/financeiro-schemas";
import type {
  ContaComParcelas,
  FinanceFormState,
} from "@/types/financeiro";
import type { Fornecedor } from "@/types/catalog";
import type { CategoriaDespesa } from "@/types/financeiro";
import { ParcelaRowEditable } from "./parcela-row";
import { formatBRL } from "@/lib/format-br";
import { Plus, Wand2, AlertTriangle } from "lucide-react";

const init: FinanceFormState = { message: undefined, errors: {} };

interface ParcelaRow {
  numero: number;
  data_vencimento: string;
  valor: number;
}

interface FormValues {
  fornecedor_id: string | null;
  categoria_id: string | null;
  plan_id: string | null;
  item_id: string | null;
  descricao: string;
  documento: string;
  emissao: string;
  valor_total: number;
  observacoes: string;
  parcelas: ParcelaRow[];
}

export interface ContaFormProps {
  open: boolean;
  conta: ContaComParcelas | null;
  fornecedores: Fornecedor[];
  categorias: CategoriaDespesa[];
  prefill?: Partial<FormValues>;
  onClose: () => void;
  onSuccess?: (contaId?: string) => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addMonths(iso: string, months: number): string {
  if (!iso) return iso;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  return date.toISOString().slice(0, 10);
}

function distribuirValor(total: number, n: number): number[] {
  if (n <= 0) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const resto = cents - base * n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push((base + (i < resto ? 1 : 0)) / 100);
  }
  return out;
}

export function ContaForm({
  open,
  conta,
  fornecedores,
  categorias,
  prefill,
  onClose,
  onSuccess,
}: ContaFormProps) {
  const { toast } = useToast();
  const isEdit = Boolean(conta?.id);

  const [createState, createAction, isCreating] = useActionState(
    createConta,
    init,
  );
  const [updateState, updateAction, isUpdating] = useActionState(
    updateConta,
    init,
  );

  const initial: FormValues = useMemo(() => {
    if (conta) {
      return {
        fornecedor_id: conta.fornecedor_id,
        categoria_id: conta.categoria_id,
        plan_id: conta.plan_id,
        item_id: conta.item_id,
        descricao: conta.descricao,
        documento: conta.documento,
        emissao: conta.emissao || "",
        valor_total: Number(conta.valor_total),
        observacoes: conta.observacoes,
        parcelas: conta.parcelas.map((p) => ({
          numero: p.numero,
          data_vencimento: p.data_vencimento,
          valor: Number(p.valor),
        })),
      };
    }
    return {
      fornecedor_id: prefill?.fornecedor_id ?? null,
      categoria_id: prefill?.categoria_id ?? null,
      plan_id: prefill?.plan_id ?? null,
      item_id: prefill?.item_id ?? null,
      descricao: prefill?.descricao ?? "",
      documento: prefill?.documento ?? "",
      emissao: prefill?.emissao ?? todayISO(),
      valor_total: prefill?.valor_total ?? 0,
      observacoes: prefill?.observacoes ?? "",
      parcelas: prefill?.parcelas ?? [
        {
          numero: 1,
          data_vencimento: addMonths(todayISO(), 1),
          valor: prefill?.valor_total ?? 0,
        },
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conta?.id, prefill]);

  const {
    values,
    setValue: setValueBase,
    errors,
    markTouched,
    isValid,
    isDirty,
    validateAll,
    reset,
  } = useLiveValidation<FormValues>(contaPagarSchema, initial);

  const setValue = useCallback(
    <K extends keyof FormValues>(name: K, value: FormValues[K]) => {
      setValueBase(name, value);
      markTouched(name as string);
    },
    [setValueBase, markTouched],
  );

  const [parcelaCount, setParcelaCount] = useState(1);
  const [parcelaStart, setParcelaStart] = useState(addMonths(todayISO(), 1));

  useEffect(() => {
    if (open) reset(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, conta?.id]);

  const state = isEdit ? updateState : createState;
  const action = isEdit ? updateAction : createAction;
  const isSaving = isEdit ? isUpdating : isCreating;

  useEffect(() => {
     
    if (state.success) {
      toast(state.message || "Salvo!");
      onSuccess?.(state.contaId);
      onClose();
    } else if (state.message && !state.success) {
      toast(state.message, "error");
    }
     
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const somaParcelas = useMemo(
    () => values.parcelas.reduce((s, p) => s + (Number(p.valor) || 0), 0),
    [values.parcelas],
  );
  const diferenca = somaParcelas - values.valor_total;
  const somaBate = Math.abs(diferenca) < 0.01;

  function gerarParcelas() {
    if (parcelaCount < 1 || values.valor_total <= 0 || !parcelaStart) {
      toast("Defina valor total, número de parcelas e data inicial.", "error");
      return;
    }
    const valores = distribuirValor(values.valor_total, parcelaCount);
    const novas: ParcelaRow[] = valores.map((v, i) => ({
      numero: i + 1,
      data_vencimento: addMonths(parcelaStart, i),
      valor: v,
    }));
    setValue("parcelas", novas);
  }

  function aplicarPreset(n: number) {
    if (values.valor_total <= 0) return;
    setParcelaCount(n);
    const inicio = parcelaStart || addMonths(todayISO(), 1);
    const valores = distribuirValor(values.valor_total, n);
    const novas: ParcelaRow[] = valores.map((v, i) => ({
      numero: i + 1,
      data_vencimento: addMonths(inicio, i),
      valor: v,
    }));
    setValue("parcelas", novas);
  }

  function adicionarParcela() {
    const ultima = values.parcelas[values.parcelas.length - 1];
    const proxNumero = (ultima?.numero ?? 0) + 1;
    const proxData = ultima
      ? addMonths(ultima.data_vencimento, 1)
      : addMonths(todayISO(), 1);
    setValue("parcelas", [
      ...values.parcelas,
      { numero: proxNumero, data_vencimento: proxData, valor: 0 },
    ]);
  }

  function removerParcela(index: number) {
    const nova = values.parcelas
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, numero: i + 1 }));
    setValue("parcelas", nova);
  }

  function atualizarParcela(index: number, next: ParcelaRow) {
    const nova = values.parcelas.map((p, i) => (i === index ? next : p));
    setValue("parcelas", nova);
  }

  function ajustarUltimaParaBaterTotal() {
    if (values.parcelas.length === 0) return;
    const idx = values.parcelas.length - 1;
    const outros = values.parcelas
      .slice(0, idx)
      .reduce((s, p) => s + p.valor, 0);
    const novoValor = Math.max(0, +(values.valor_total - outros).toFixed(2));
    atualizarParcela(idx, { ...values.parcelas[idx], valor: novoValor });
  }

  function submit() {
    if (!validateAll()) {
      toast("Verifique os campos antes de salvar.", "error");
      return;
    }
    const fd = new FormData();
    if (conta?.id) fd.set("id", conta.id);
    if (conta?.tenant_id) fd.set("tenant_id", conta.tenant_id);
    if (values.fornecedor_id) fd.set("fornecedor_id", values.fornecedor_id);
    if (values.categoria_id) fd.set("categoria_id", values.categoria_id);
    if (values.plan_id) fd.set("plan_id", values.plan_id);
    if (values.item_id) fd.set("item_id", values.item_id);
    fd.set("descricao", values.descricao);
    fd.set("documento", values.documento);
    fd.set("emissao", values.emissao || "");
    fd.set("valor_total", String(values.valor_total));
    fd.set("observacoes", values.observacoes);
    fd.set("parcelas", JSON.stringify(values.parcelas));
    action(fd);
  }

  const camposObrigatoriosPreenchidos =
    (values.descricao.trim().length >= 2 ? 1 : 0) +
    (values.valor_total > 0 ? 1 : 0) +
    (values.parcelas.length > 0 && somaBate ? 1 : 0);
  const totalObrigatorios = 3;

  if (!open) return null;

  return (
    <FormDialog
      open
      title={isEdit ? "Editar conta a pagar" : "Nova conta a pagar"}
      subtitle={
        isEdit
          ? "Edite a conta. Pagamentos registrados precisam ser estornados antes."
          : "Cadastre uma despesa com uma ou mais parcelas."
      }
      isDirty={isDirty}
      onClose={onClose}
      onSubmit={submit}
      isSaving={isSaving}
      canSave={isValid && somaBate}
      serverError={!state.success ? state.message : undefined}
      submitLabel={isEdit ? "Salvar alterações" : "Criar conta"}
      progress={{ filled: camposObrigatoriosPreenchidos, total: totalObrigatorios }}
      size="lg"
    >
      {/* Identificação */}
      <Field
        id="conta-descricao"
        label="Descrição"
        required
        helpText="O que está sendo pago."
        maxLength={200}
        value={values.descricao}
        error={errors.descricao}
      >
        <Input
          id="conta-descricao"
          value={values.descricao}
          onChange={(e) => setValue("descricao", e.target.value)}
          onBlur={() => markTouched("descricao")}
          maxLength={200}
          placeholder="Ex: Aluguel sala 305 — maio/2026"
          aria-invalid={Boolean(errors.descricao)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field
          id="conta-documento"
          label="Documento / NF"
          helpText="Número da NF, boleto ou recibo."
          error={errors.documento}
        >
          <Input
            id="conta-documento"
            value={values.documento}
            onChange={(e) => setValue("documento", e.target.value)}
            onBlur={() => markTouched("documento")}
            maxLength={60}
            placeholder="NF 1234"
          />
        </Field>

        <Field id="conta-emissao" label="Emissão" error={errors.emissao}>
          <Input
            id="conta-emissao"
            type="date"
            value={values.emissao}
            onChange={(e) => setValue("emissao", e.target.value)}
            onBlur={() => markTouched("emissao")}
          />
        </Field>

        <Field
          id="conta-valor"
          label="Valor total"
          required
          error={errors.valor_total}
        >
          <BRLInput
            id="conta-valor"
            value={values.valor_total}
            onChange={(next) => setValue("valor_total", next)}
            onBlur={() => markTouched("valor_total")}
            className="text-right tabular-nums"
            aria-invalid={Boolean(errors.valor_total)}
          />
        </Field>
      </div>

      {/* Vínculos */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="conta-fornecedor" label="Fornecedor">
          <Select
            id="conta-fornecedor"
            value={values.fornecedor_id ?? ""}
            onChange={(e) =>
              setValue("fornecedor_id", e.target.value || null)
            }
          >
            <option value="">— Sem fornecedor —</option>
            {fornecedores
              .filter((f) => f.active)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </Select>
        </Field>

        <Field id="conta-categoria" label="Categoria de despesa">
          <Select
            id="conta-categoria"
            value={values.categoria_id ?? ""}
            onChange={(e) =>
              setValue("categoria_id", e.target.value || null)
            }
          >
            <option value="">— Sem categoria —</option>
            {categorias
              .filter((c) => c.active)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>
        </Field>
      </div>

      {(values.plan_id || values.item_id) && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
          Esta conta está vinculada a um item de plano de ação. O vínculo é
          mantido automaticamente.
        </div>
      )}

      {/* Parcelas: quick-fill */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/40 p-3 dark:border-zinc-700 dark:bg-zinc-800/30 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Parcelas</h4>
          <span
            className={`text-xs tabular-nums ${
              somaBate
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            Soma: {formatBRL(somaParcelas)} de {formatBRL(values.valor_total)}
            {!somaBate &&
              ` (${diferenca > 0 ? "+" : ""}${formatBRL(diferenca)})`}
          </span>
        </div>

        {/* Presets rápidos */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1">
          <span className="text-[11px] uppercase tracking-wide text-zinc-500 mr-1">
            Presets:
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => aplicarPreset(1)}
            className="h-7 text-xs"
            disabled={values.valor_total <= 0}
            title="Pagamento único na data inicial"
          >
            À vista
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => aplicarPreset(2)}
            className="h-7 text-xs"
            disabled={values.valor_total <= 0}
            title="2x mensais a partir da data inicial"
          >
            2x
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => aplicarPreset(3)}
            className="h-7 text-xs"
            disabled={values.valor_total <= 0}
            title="3x mensais a partir da data inicial"
          >
            3x
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => aplicarPreset(6)}
            className="h-7 text-xs"
            disabled={values.valor_total <= 0}
          >
            6x
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => aplicarPreset(12)}
            className="h-7 text-xs"
            disabled={values.valor_total <= 0}
          >
            12x
          </Button>
        </div>

        <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-12">
          <div className="sm:col-span-3">
            <label className="text-xs text-zinc-500">Nº parcelas</label>
            <Input
              type="number"
              min="1"
              max="120"
              value={String(parcelaCount)}
              onChange={(e) =>
                setParcelaCount(Math.max(1, Number(e.target.value) || 1))
              }
              className="h-9"
            />
          </div>
          <div className="sm:col-span-4">
            <label className="text-xs text-zinc-500">
              Vencimento da 1ª parcela
            </label>
            <Input
              type="date"
              value={parcelaStart}
              onChange={(e) => setParcelaStart(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="sm:col-span-5 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={gerarParcelas}
            >
              <Wand2 className="h-3.5 w-3.5" /> Gerar parcelas
            </Button>
            {!somaBate && values.parcelas.length > 0 && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={ajustarUltimaParaBaterTotal}
                title="Ajusta a última parcela para que a soma bata com o total"
                className="animate-pulse"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Ajustar última
              </Button>
            )}
          </div>
        </div>

        {/* Lista editável */}
        <div className="space-y-1.5 pt-1">
          <div className="grid grid-cols-12 gap-2 px-1 text-[11px] uppercase tracking-wide text-zinc-500">
            <div className="col-span-1 text-center">Nº</div>
            <div className="col-span-5">Vencimento</div>
            <div className="col-span-5 text-right pr-2">Valor</div>
            <div className="col-span-1"></div>
          </div>
          {values.parcelas.map((p, i) => (
            <ParcelaRowEditable
              key={i}
              parcela={p}
              index={i}
              canRemove={values.parcelas.length > 1}
              onChange={(next) => atualizarParcela(i, next)}
              onRemove={() => removerParcela(i)}
            />
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={adicionarParcela}
            className="h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar parcela
          </Button>
        </div>

        {errors.parcelas && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {errors.parcelas}
          </p>
        )}
      </div>

      <Field
        id="conta-obs"
        label="Observações"
        helpText="Notas internas sobre essa conta."
        maxLength={2000}
        value={values.observacoes}
        error={errors.observacoes}
      >
        <textarea
          id="conta-obs"
          rows={2}
          maxLength={2000}
          value={values.observacoes}
          onChange={(e) => setValue("observacoes", e.target.value)}
          onBlur={() => markTouched("observacoes")}
          placeholder="Anotações sobre essa despesa..."
          className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 resize-none"
        />
      </Field>
    </FormDialog>
  );
}
