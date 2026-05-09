"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BRLInput } from "@/components/ui/brl-input";
import { Trash2 } from "lucide-react";
import { formatDateBR, formatBRL } from "@/lib/format-br";
import type { ParcelaInputValues } from "@/lib/schemas/financeiro-schemas";

interface ParcelaRowEditableProps {
  parcela: ParcelaInputValues;
  index: number;
  canRemove: boolean;
  onChange: (next: ParcelaInputValues) => void;
  onRemove: () => void;
}

export function ParcelaRowEditable({
  parcela,
  index,
  canRemove,
  onChange,
  onRemove,
}: ParcelaRowEditableProps) {
  return (
    <div className="grid grid-cols-12 items-center gap-2">
      <div className="col-span-1 text-center text-xs font-semibold text-zinc-500 tabular-nums">
        #{index + 1}
      </div>
      <div className="col-span-5">
        <Input
          type="date"
          value={parcela.data_vencimento}
          onChange={(e) =>
            onChange({ ...parcela, data_vencimento: e.target.value })
          }
          className="h-9"
        />
      </div>
      <div className="col-span-5">
        <BRLInput
          value={parcela.valor}
          onChange={(next) => onChange({ ...parcela, valor: next })}
          className="h-9 text-right tabular-nums"
        />
      </div>
      <div className="col-span-1 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={!canRemove}
          title="Remover parcela"
          className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500 disabled:opacity-30"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface ParcelaReadOnlyProps {
  numero: number;
  data_vencimento: string;
  valor: number;
  status: "pendente" | "pago" | "cancelado";
  data_pagamento?: string | null;
  valor_pago?: number | null;
}

export function ParcelaSummaryBadge({
  numero,
  data_vencimento,
  valor,
  status,
  data_pagamento,
  valor_pago,
}: ParcelaReadOnlyProps) {
  const hoje = new Date().toISOString().slice(0, 10);
  const atrasada = status === "pendente" && data_vencimento < hoje;
  return (
    <div className="text-xs">
      <div className="flex items-center gap-2 font-medium">
        <span>Parcela {numero}</span>
        <span className="text-zinc-400">•</span>
        <span className="tabular-nums">{formatDateBR(data_vencimento)}</span>
        <span className="text-zinc-400">•</span>
        <span className="tabular-nums">{formatBRL(valor)}</span>
        {status === "pago" && (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            Pago
          </span>
        )}
        {status === "cancelado" && (
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-500 dark:bg-zinc-800">
            Cancelada
          </span>
        )}
        {atrasada && (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700 dark:bg-red-950/40 dark:text-red-300">
            Atrasada
          </span>
        )}
      </div>
      {status === "pago" && data_pagamento && (
        <div className="mt-0.5 text-zinc-500">
          Pago em {formatDateBR(data_pagamento)} —{" "}
          {formatBRL(valor_pago ?? valor)}
        </div>
      )}
    </div>
  );
}
