"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
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
import { X, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormDialogProps {
  open: boolean;
  title: string;
  subtitle?: string;
  isDirty: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  canSave: boolean;
  serverError?: string;
  children: ReactNode;
  /** Filled fields / total fields, ativa barra de progresso. */
  progress?: { filled: number; total: number };
  /** Texto custom no botão primário. Default: "Salvar". */
  submitLabel?: string;
  /** Tamanho do diálogo. */
  size?: "sm" | "md" | "lg";
  /** Conteúdo abaixo do header (ex: chips de template). */
  topSlot?: ReactNode;
}

const sizeClasses: Record<NonNullable<FormDialogProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

/**
 * Diálogo padronizado para formulários:
 * - Header com título + subtítulo + botão fechar
 * - Barra de progresso opcional (campos preenchidos / total)
 * - Slot superior para chips/atalhos de template
 * - Body com formulário
 * - Footer fixo com Cancelar + Salvar
 * - ESC fecha (com confirmação se isDirty), Ctrl/Cmd+Enter salva
 * - Click no overlay também fecha (com confirmação)
 */
export function FormDialog({
  open,
  title,
  subtitle,
  isDirty,
  onClose,
  onSubmit,
  isSaving,
  canSave,
  serverError,
  children,
  progress,
  submitLabel = "Salvar",
  size = "md",
  topSlot,
}: FormDialogProps) {
  const [confirmClose, setConfirmClose] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const tryClose = () => {
    if (isDirty) setConfirmClose(true);
    else onClose();
  };

  useEscapeKey(tryClose, open && !confirmClose);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const focusable = containerRef.current?.querySelector<HTMLElement>(
        "input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled])",
      );
      focusable?.focus();
      if (focusable instanceof HTMLInputElement) focusable.select();
    }, 50);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const pct = progress
    ? Math.min(100, Math.round((progress.filled / Math.max(1, progress.total)) * 100))
    : 0;

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
          className={cn(
            "flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900",
            sizeClasses[size],
          )}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canSave && !isSaving) {
              e.preventDefault();
              onSubmit();
            }
          }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between px-6 pt-5 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
              {subtitle && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={tryClose} aria-label="Fechar">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          {progress && (
            <div className="shrink-0 px-6 pb-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Progresso
                </span>
                <span className="text-xs font-medium tabular-nums text-zinc-500">
                  {progress.filled}/{progress.total}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-accent-500 transition-all"
                  style={{ width: `${pct}%` }}
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  role="progressbar"
                />
              </div>
            </div>
          )}

          {topSlot && <div className="shrink-0 border-t border-zinc-100 px-6 py-3 dark:border-zinc-800">{topSlot}</div>}

          {/* Body */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canSave && !isSaving) onSubmit();
            }}
            className="flex min-h-0 flex-1 flex-col border-t border-zinc-100 dark:border-zinc-800"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {children}

              {serverError && (
                <div
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
                >
                  {serverError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
              <p className="hidden text-[10px] text-zinc-400 sm:block">
                <kbd className="rounded border border-zinc-300 bg-white px-1 dark:border-zinc-700 dark:bg-zinc-800">
                  Esc
                </kbd>{" "}
                cancela ·{" "}
                <kbd className="rounded border border-zinc-300 bg-white px-1 dark:border-zinc-700 dark:bg-zinc-800">
                  Ctrl+Enter
                </kbd>{" "}
                salva
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" type="button" onClick={tryClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={isSaving}
                  disabled={!canSave || isSaving}
                >
                  <Save className="h-4 w-4" /> {submitLabel}
                </Button>
              </div>
            </div>
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
