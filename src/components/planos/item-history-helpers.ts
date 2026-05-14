import type { AuditEntry } from "@/types/action-plan";

export function getAuditEntryTone(action: string): string {
  if (action.includes("DELETE")) return "text-red-600 dark:text-red-400";
  if (action.includes("CREATE")) return "text-emerald-600 dark:text-emerald-400";
  return "text-blue-600 dark:text-blue-400";
}

export function getAuditEntryMarker(action: string): string {
  if (action.includes("DELETE")) return "−";
  if (action.includes("CREATE")) return "+";
  return "~";
}

export function getAuditEntrySummary(entry: AuditEntry): string {
  if (entry.action === "CREATE_ITEM") {
    return "Item criado";
  }

  if (entry.action === "DELETE_ITEM") {
    return "Item removido";
  }

  if (entry.action === "UPDATE_ITEM") {
    const snapshot = entry.snapshot || {};
    if ("status" in snapshot && Object.keys(snapshot).length <= 2) {
      return "Farol recalculado";
    }
    if ("planned_start" in snapshot || "planned_end" in snapshot) {
      return "Cronograma atualizado";
    }
    if ("responsible" in snapshot) {
      return "Responsável atualizado";
    }
    if ("cost" in snapshot) {
      return "Custo atualizado";
    }
    return "Item atualizado";
  }

  return entry.action.replaceAll("_", " ");
}

export function formatAuditEntryDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}
