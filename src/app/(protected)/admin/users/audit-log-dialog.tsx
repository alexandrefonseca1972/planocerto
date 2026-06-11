"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { History } from "lucide-react";
import type { AuditLogEntry } from "@/app/actions/admin";
import type { Profile } from "@/types/auth";
import { formatDate } from "@/lib/utils";

const AUDIT_ACTION_LABELS: Record<string, string> = {
  create_user: "Criou usuário",
  update_user: "Editou usuário",
  delete_user: "Excluiu usuário",
  deactivate_user: "Desativou usuário",
  activate_user: "Reativou usuário",
  bulk_delete_user: "Excluiu em lote",
};

export function AuditLogDialog({
  user,
  entries,
  loading,
  onClose,
}: {
  user: Profile;
  entries: AuditLogEntry[];
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <AlertDialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <AlertDialogHeader className="shrink-0">
          <AlertDialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de alterações
          </AlertDialogTitle>
          <AlertDialogDescription>
            {user.name || user.email}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-zinc-400">
              Carregando...
            </div>
          ) : entries.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-zinc-400">
              Nenhum registro encontrado.
            </div>
          ) : (
            <ol className="relative ml-3 border-l border-zinc-200 dark:border-zinc-700">
              {entries.map((entry) => (
                <li key={entry.id} className="mb-4 ml-4">
                  <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border border-white bg-zinc-300 dark:border-zinc-900 dark:bg-zinc-600" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        por {entry.admin_name || entry.admin_email || entry.admin_id}
                      </p>
                      {entry.snapshot && Object.keys(entry.snapshot).length > 0 && (
                        <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                          {Object.entries(entry.snapshot).map(([k, v]) => (
                            <div key={k} className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              <span className="font-medium">{k}:</span>{" "}
                              <span>{String(v)}</span>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                    <time className="shrink-0 text-[11px] text-zinc-400">
                      {new Date(entry.created_at).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <AlertDialogFooter className="shrink-0 pt-3">
          <AlertDialogCancel onClick={onClose}>Fechar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
