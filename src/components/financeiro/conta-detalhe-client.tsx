"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Pencil,
  XCircle,
  Trash2,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
  Receipt,
  CheckCheck,
  Calendar,
} from "lucide-react";
import {
  cancelarConta,
  estornarPagamento,
  getContaById,
  deleteConta,
  pagarParcelasEmLote,
} from "@/app/actions/contas-pagar";
import { ContaForm } from "./conta-form";
import { PagamentoDialog } from "./pagamento-dialog";
import { ContaAttachmentSection } from "./conta-attachment-section";
import { Select } from "@/components/ui/select";
import {
  FORMAS_PAGAMENTO,
  FORMA_PAGAMENTO_LABELS,
  type FormaPagamento,
  type ContaComParcelas,
  type ParcelaPagar,
} from "@/types/financeiro";
import type { Fornecedor } from "@/types/catalog";
import type { CategoriaDespesa } from "@/types/financeiro";
import { formatBRL, formatDateBR } from "@/lib/format-br";

function statusBadge(c: ContaComParcelas) {
  if (c.status === "cancelado") return <Badge variant="muted">Cancelada</Badge>;
  if (c.status === "quitado") return <Badge variant="success">Quitada</Badge>;
  if (c.tem_atrasada)
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" /> Atrasada
      </Badge>
    );
  if (c.status === "parcial") return <Badge variant="warning">Parcial</Badge>;
  return <Badge variant="outline">Pendente</Badge>;
}

function parcelaStatusBadge(p: ParcelaPagar) {
  const hoje = new Date().toISOString().slice(0, 10);
  if (p.status === "cancelado") return <Badge variant="muted">Cancelada</Badge>;
  if (p.status === "pago") return <Badge variant="success">Pago</Badge>;
  if (p.data_vencimento < hoje)
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" /> Atrasada
      </Badge>
    );
  return <Badge variant="outline">Pendente</Badge>;
}

export function ContaDetalheClient({
  initial,
  fornecedores,
  categorias,
}: {
  initial: ContaComParcelas;
  fornecedores: Fornecedor[];
  categorias: CategoriaDespesa[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [conta, setConta] = useState<ContaComParcelas>(initial);
  const [editing, setEditing] = useState(false);
  const [pagandoParcela, setPagandoParcela] = useState<ParcelaPagar | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [motivoCancel, setMotivoCancel] = useState("");
  const [confirmEstorno, setConfirmEstorno] = useState<ParcelaPagar | null>(null);
  const [isEstornando, setIsEstornando] = useState(false);
  const [showBatchPay, setShowBatchPay] = useState(false);
  const [batchData, setBatchData] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [batchForma, setBatchForma] = useState<FormaPagamento>("pix");
  const [, startTransition] = useTransition();

  async function refresh() {
    const fresh = await getContaById(conta.id);
    if (fresh) setConta(fresh);
    router.refresh();
  }

  async function confirmarEstorno() {
    if (!confirmEstorno) return;
    setIsEstornando(true);
    try {
      const res = await estornarPagamento(confirmEstorno.id);
      if (res.success) {
        toast(res.message || "Pagamento estornado.");
        setConfirmEstorno(null);
        refresh();
      } else {
        toast(res.message || "Erro ao estornar.", "error");
      }
    } finally {
      setIsEstornando(false);
    }
  }

  function handleCancel() {
    startTransition(async () => {
      const res = await cancelarConta(conta.id, motivoCancel);
      if (res.success) {
        toast(res.message || "Conta cancelada.");
        setConfirmCancel(false);
        setMotivoCancel("");
        refresh();
      } else {
        toast(res.message || "Erro ao cancelar.", "error");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", conta.id);
      const res = await deleteConta({}, fd);
      if (res.success) {
        toast(res.message || "Conta excluída.");
        router.push("/financeiro/contas-a-pagar");
      } else {
        toast(res.message || "Erro ao excluir.", "error");
      }
    });
  }

  function handleBatchPay() {
    const ids = conta.parcelas
      .filter((p) => p.status === "pendente")
      .map((p) => p.id);
    if (ids.length === 0) {
      toast("Nenhuma parcela pendente.", "error");
      return;
    }
    startTransition(async () => {
      const res = await pagarParcelasEmLote(ids, batchData, batchForma);
      if (res.success && !res.failedIds?.length) {
        toast(res.message || "Parcelas pagas.");
        setShowBatchPay(false);
        refresh();
      } else if (res.success && res.failedIds?.length) {
        toast(res.message || "Pagamento parcial — algumas parcelas falharam.", "error");
        refresh();
      } else {
        toast(res.message || "Erro ao processar pagamentos.", "error");
      }
    });
  }

  const podeEditar =
    conta.status !== "cancelado" && (conta.total_pago ?? 0) === 0;
  const podeCancelar = conta.status !== "cancelado";
  const podeExcluir = (conta.total_pago ?? 0) === 0;
  const parcelasPendentesCount = conta.parcelas.filter(
    (p) => p.status === "pendente",
  ).length;
  const valorTotal = Number(conta.valor_total) || 0;
  const totalPago = conta.total_pago ?? 0;
  const progressoPct =
    valorTotal > 0 ? Math.min(100, Math.round((totalPago / valorTotal) * 100)) : 0;
  const hoje = new Date().toISOString().slice(0, 10);
  const proxAtrasada =
    !!conta.proxima_vencimento && conta.proxima_vencimento < hoje;

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/financeiro">Financeiro</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/financeiro/contas-a-pagar">Contas a pagar</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{conta.descricao}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/financeiro/contas-a-pagar"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold">
            <Receipt className="h-5 w-5 text-accent-600" /> {conta.descricao}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            {statusBadge(conta)}
            {conta.documento && <span>Doc: {conta.documento}</span>}
            {conta.emissao && (
              <span>Emissão: {formatDateBR(conta.emissao)}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {parcelasPendentesCount > 0 && conta.status !== "cancelado" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowBatchPay(true)}
            >
              <CheckCheck className="h-4 w-4" /> Pagar todas pendentes (
              {parcelasPendentesCount})
            </Button>
          )}
          {podeEditar && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          )}
          {podeCancelar && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmCancel(true)}
            >
              <XCircle className="h-4 w-4" /> Cancelar conta
            </Button>
          )}
          {podeExcluir && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          )}
        </div>
      </div>

      {/* Barra de progresso visual */}
      {valorTotal > 0 && conta.status !== "cancelado" && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>
              Progresso de pagamento — {progressoPct}%
            </span>
            <span className="tabular-nums">
              {formatBRL(totalPago)} / {formatBRL(valorTotal)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all ${
                progressoPct === 100
                  ? "bg-emerald-500"
                  : proxAtrasada
                    ? "bg-amber-500"
                    : "bg-blue-500"
              }`}
              style={{ width: `${progressoPct}%` }}
            />
          </div>
          {proxAtrasada && conta.proxima_vencimento && (
            <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3 w-3" />
              Parcela atrasada desde {formatDateBR(conta.proxima_vencimento)}.
            </p>
          )}
          {!proxAtrasada && conta.proxima_vencimento && progressoPct < 100 && (
            <p className="flex items-center gap-1 text-xs text-zinc-500">
              <Calendar className="h-3 w-3" />
              Próximo vencimento: {formatDateBR(conta.proxima_vencimento)}
            </p>
          )}
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-zinc-500">Valor total</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatBRL(Number(conta.valor_total))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-zinc-500">Pago</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatBRL(conta.total_pago ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-zinc-500">Em aberto</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatBRL(conta.total_pendente ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-zinc-500">
              {conta.tem_atrasada ? "Próxima em atraso" : "Próximo vencimento"}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {conta.proxima_vencimento
                ? formatDateBR(conta.proxima_vencimento)
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vínculos */}
      {(conta.fornecedor_nome ||
        conta.categoria_nome ||
        conta.plan_id ||
        conta.observacoes) && (
        <Card>
          <CardContent className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {conta.fornecedor_nome && (
              <div>
                <p className="text-xs uppercase text-zinc-500">Fornecedor</p>
                <p className="mt-0.5 text-sm">{conta.fornecedor_nome}</p>
              </div>
            )}
            {conta.categoria_nome && (
              <div>
                <p className="text-xs uppercase text-zinc-500">Categoria</p>
                <p className="mt-0.5 text-sm">{conta.categoria_nome}</p>
              </div>
            )}
            {conta.plan_id && (
              <div>
                <p className="text-xs uppercase text-zinc-500">Plano</p>
                <Link
                  href="/planos"
                  className="mt-0.5 block text-sm text-blue-600 hover:underline dark:text-blue-300"
                >
                  {conta.plan_title || conta.plan_id.slice(0, 8)}
                  {conta.item_action ? ` — ${conta.item_action}` : ""}
                </Link>
              </div>
            )}
            {conta.observacoes && (
              <div className="sm:col-span-2">
                <p className="text-xs uppercase text-zinc-500">Observações</p>
                <p className="mt-0.5 whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
                  {conta.observacoes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Parcelas */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <h3 className="text-sm font-semibold">
              Parcelas ({conta.parcelas.length})
            </h3>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {conta.parcelas.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="w-12 text-center font-semibold text-zinc-500 tabular-nums">
                  #{p.numero}
                </div>
                <div className="min-w-[140px]">
                  <p className="text-xs text-zinc-500">Vencimento</p>
                  <p className="text-sm tabular-nums">
                    {formatDateBR(p.data_vencimento)}
                  </p>
                </div>
                <div className="min-w-[120px]">
                  <p className="text-xs text-zinc-500">Valor</p>
                  <p className="text-sm font-medium tabular-nums">
                    {formatBRL(Number(p.valor))}
                  </p>
                </div>
                {p.status === "pago" && (
                  <div className="min-w-[160px] text-emerald-700 dark:text-emerald-300">
                    <p className="text-xs uppercase">Pago em</p>
                    <p className="text-sm tabular-nums">
                      {formatDateBR(p.data_pagamento)} —{" "}
                      {formatBRL(Number(p.valor_pago ?? p.valor))}
                    </p>
                  </div>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {parcelaStatusBadge(p)}
                  {p.status === "pendente" && conta.status !== "cancelado" && (
                    <Button
                      size="sm"
                      onClick={() => setPagandoParcela(p)}
                    >
                      <CheckCircle className="h-4 w-4" /> Registrar pagamento
                    </Button>
                  )}
                  {p.status === "pago" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmEstorno(p)}
                    >
                      <RotateCcw className="h-4 w-4" /> Estornar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anexos */}
      <Card>
        <CardContent className="p-4">
          <ContaAttachmentSection contaId={conta.id} />
        </CardContent>
      </Card>

      {editing && (
        <ContaForm
          open
          conta={conta}
          fornecedores={fornecedores}
          categorias={categorias}
          onClose={() => setEditing(false)}
          onSuccess={() => {
            setEditing(false);
            refresh();
          }}
        />
      )}

      <PagamentoDialog
        open={Boolean(pagandoParcela)}
        parcela={pagandoParcela}
        onClose={() => setPagandoParcela(null)}
        onSuccess={refresh}
      />

      <AlertDialog
        open={confirmCancel}
        onOpenChange={(open) => !open && setConfirmCancel(false)}
      >
        <AlertDialogContent closeOnOverlayClick={false} closeOnEsc={false}>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar esta conta?</AlertDialogTitle>
            <AlertDialogDescription>
              As parcelas pendentes serão marcadas como canceladas. Pagamentos já
              registrados são preservados. Você pode descrever um motivo (opcional)
              que será adicionado às observações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            value={motivoCancel}
            onChange={(e) => setMotivoCancel(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Motivo do cancelamento..."
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmCancel(false)}>
              Voltar
            </AlertDialogCancel>
            <Button variant="destructive" onClick={handleCancel}>
              <XCircle className="h-4 w-4" /> Cancelar conta
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showBatchPay}
        onOpenChange={(open) => !open && setShowBatchPay(false)}
      >
        <AlertDialogContent closeOnOverlayClick={false} closeOnEsc={false}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Pagar {parcelasPendentesCount} parcela(s) pendentes?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Todas as parcelas pendentes serão marcadas como pagas com a data
              e forma escolhidas. O valor pago será igual ao valor da parcela
              (ajuste individualmente se houver juros/multa).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-zinc-500">Data do pagamento</label>
              <input
                type="date"
                value={batchData}
                onChange={(e) => setBatchData(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500">Forma</label>
              <Select
                value={batchForma}
                onChange={(e) =>
                  setBatchForma(e.target.value as FormaPagamento)
                }
                className="mt-1"
              >
                {FORMAS_PAGAMENTO.map((f) => (
                  <option key={f} value={f}>
                    {FORMA_PAGAMENTO_LABELS[f]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowBatchPay(false)}>
              Cancelar
            </AlertDialogCancel>
            <Button onClick={handleBatchPay}>
              <CheckCheck className="h-4 w-4" /> Confirmar pagamento
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta conta?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Confirma a exclusão de "${conta.descricao}"? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDelete(false)}>
              Cancelar
            </AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação de estorno */}
      <AlertDialog
        open={Boolean(confirmEstorno)}
        onOpenChange={(open) => { if (!open) setConfirmEstorno(null); }}
      >
        {confirmEstorno && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Estornar pagamento?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  <span className="block">
                    Confirma o estorno da parcela{" "}
                    <strong className="text-zinc-900 dark:text-zinc-50">
                      {confirmEstorno.numero}
                    </strong>
                    {confirmEstorno.valor_pago
                      ? ` — ${formatBRL(Number(confirmEstorno.valor_pago))} pagos`
                      : ""}
                    ?
                  </span>
                  <span className="mt-2 block rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    <strong>Atenção:</strong> O pagamento será revertido e a parcela voltará ao status <em>pendente</em>. Esta ação não pode ser desfeita.
                  </span>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmEstorno(null)}>
                Cancelar
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={confirmarEstorno}
                isLoading={isEstornando}
              >
                <RotateCcw className="h-4 w-4" /> Confirmar estorno
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
