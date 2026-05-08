"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useEscapeKey } from "@/lib/hooks/use-escape-key";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Search,
  ChevronLeft,
  Power,
  PowerOff,
  type LucideIcon,
} from "lucide-react";

export interface BaseCatalogRow {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
}

export interface ExtraColumn<T> {
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
}

interface CatalogTableProps<T extends BaseCatalogRow> {
  items: T[];
  extraColumns?: ExtraColumn<T>[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onToggle: (item: T) => void;
  togglingId: string | null;
  feminine?: boolean; // controla concordância "Ativa"/"Ativo"
  emptyMessage: string;
}

/** Tabela padronizada de catálogo: Ordem | Nome | [extras] | Status | Ações. */
export function CatalogTable<T extends BaseCatalogRow>({
  items,
  extraColumns = [],
  onEdit,
  onDelete,
  onToggle,
  togglingId,
  feminine,
  emptyMessage,
}: CatalogTableProps<T>) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-zinc-500">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-800/50">
          <tr className="text-left text-xs font-medium uppercase text-zinc-500">
            <th className="px-3 py-2 w-16">Ordem</th>
            <th className="px-3 py-2">Nome</th>
            {extraColumns.map((c) => (
              <th key={c.header} className={`px-3 py-2 ${c.className || ""}`}>
                {c.header}
              </th>
            ))}
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map((item) => (
            <tr
              key={item.id}
              className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/30 ${
                !item.active ? "opacity-60" : ""
              }`}
            >
              <td className="px-3 py-2 text-zinc-500 tabular-nums">{item.sort_order}</td>
              <td className="px-3 py-2 font-medium">{item.name}</td>
              {extraColumns.map((c) => (
                <td key={c.header} className={`px-3 py-2 ${c.className || ""}`}>
                  {c.cell(item)}
                </td>
              ))}
              <td className="px-3 py-2">
                {item.active ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                    Ativ{feminine ? "a" : "o"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
                    Inativ{feminine ? "a" : "o"}
                  </span>
                )}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggle(item)}
                    disabled={togglingId === item.id}
                    title={item.active ? "Desativar" : "Ativar"}
                    aria-label={item.active ? "Desativar" : "Ativar"}
                  >
                    {item.active ? (
                      <PowerOff className="h-3.5 w-3.5" />
                    ) : (
                      <Power className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(item)}
                    title="Editar"
                    aria-label="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(item)}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    title="Excluir"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface CatalogModalProps {
  open: boolean;
  title: string;
  isDirty: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  canSave: boolean;
  serverError?: string;
  children: ReactNode;
}

/** Modal padronizado: ESC fecha (com confirmação se sujo), Ctrl/Cmd+Enter salva. */
export function CatalogModal({
  open,
  title,
  isDirty,
  onClose,
  onSubmit,
  isSaving,
  canSave,
  serverError,
  children,
}: CatalogModalProps) {
  const [confirmClose, setConfirmClose] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const tryClose = () => {
    if (isDirty) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  };

  useEscapeKey(tryClose, open);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => {
        const focusable = containerRef.current?.querySelector<HTMLElement>(
          "input:not([type=hidden]), textarea, select",
        );
        focusable?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) tryClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          ref={containerRef}
          className="w-full max-w-md rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canSave && !isSaving) {
              e.preventDefault();
              onSubmit();
            }
          }}
        >
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-700">
            <h3 className="text-base font-semibold">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={tryClose}
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canSave && !isSaving) onSubmit();
            }}
            className="space-y-3 p-6"
          >
            {children}

            {serverError && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
              >
                {serverError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <Button variant="outline" type="button" onClick={tryClose}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSaving} disabled={!canSave || isSaving}>
                <Save className="h-4 w-4" /> Salvar
              </Button>
            </div>
            <p className="pt-1 text-center text-[10px] text-zinc-400">
              Esc cancela · Ctrl+Enter salva
            </p>
          </form>
        </div>
      </div>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem mudanças não salvas. Deseja fechar sem salvar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmClose(false)}>
              Continuar editando
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmClose(false);
                onClose();
              }}
            >
              Descartar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface CatalogHeaderProps {
  title: string;
  icon: LucideIcon;
  subtitle: string;
  search: string;
  onSearchChange: (v: string) => void;
  showInactive: boolean;
  onToggleInactive: (v: boolean) => void;
  onCreate: () => void;
  createLabel: string;
  extraFilters?: ReactNode;
}

/** Cabeçalho padrão: breadcrumb + título + filtros + botão criar. */
export function CatalogHeader({
  title,
  icon: Icon,
  subtitle,
  search,
  onSearchChange,
  showInactive,
  onToggleInactive,
  onCreate,
  createLabel,
  extraFilters,
}: CatalogHeaderProps) {
  return (
    <>
      <div>
        <Link
          href="/admin/catalogos"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          <ChevronLeft className="h-4 w-4" /> Catálogos
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon className="h-5 w-5" /> {title}
          </h2>
          <p className="text-sm text-zinc-500">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {extraFilters}
          <label className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => onToggleInactive(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Mostrar inativ{ /* concordância vai por contexto */ "as/os"}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar..."
              className="h-9 w-64 pl-8"
            />
          </div>
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4" /> {createLabel}
          </Button>
        </div>
      </div>
    </>
  );
}

interface DeleteDialogProps<T extends BaseCatalogRow> {
  item: T | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  entityLabel: string;
  warning?: string;
}

export function DeleteDialog<T extends BaseCatalogRow>({
  item,
  isDeleting,
  onConfirm,
  onCancel,
  entityLabel,
  warning,
}: DeleteDialogProps<T>) {
  return (
    <AlertDialog open={Boolean(item)} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {entityLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            {`Confirma a exclusão de "${item?.name ?? ""}"? ${warning ?? "Esta ação não pode ser desfeita."}`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={onConfirm} isLoading={isDeleting}>
            <Trash2 className="h-4 w-4" /> Excluir
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface CharCounterProps {
  value: string;
  max: number;
}

export function CharCounter({ value, max }: CharCounterProps) {
  const len = value.length;
  const pct = len / max;
  const tone =
    pct >= 1
      ? "text-red-600"
      : pct >= 0.85
      ? "text-amber-600"
      : "text-zinc-400";
  return (
    <span className={`text-[10px] tabular-nums ${tone}`} aria-live="polite">
      {len}/{max}
    </span>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-600" role="alert">
      {message}
    </p>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
