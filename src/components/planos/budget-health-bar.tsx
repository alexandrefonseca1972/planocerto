import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format-br";
import { AlertOctagon, Wallet } from "lucide-react";

interface BudgetHealthBarProps {
  totalCost: number;
  budgetLimit: number;
  isOverBudget: boolean;
  percentUsed: number;
}

export function BudgetHealthBar({ totalCost, budgetLimit, isOverBudget, percentUsed }: BudgetHealthBarProps) {
  if (budgetLimit <= 0) return null;

  return (
    <div className={cn(
      "mt-3 flex max-w-fit items-center gap-3 rounded-xl border p-2.5 transition-all",
      isOverBudget
        ? "border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10"
        : "border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/20 dark:bg-emerald-950/5"
    )}>
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg shadow-sm",
        isOverBudget ? "bg-red-100 text-red-600 dark:bg-red-900/40" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40"
      )}>
        {isOverBudget ? <AlertOctagon className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Saúde Financeira</span>
          {isOverBudget && <Badge className="h-4 px-1.5 text-[9px] bg-red-500 hover:bg-red-600">ORÇAMENTO ESTOURADO</Badge>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatBRL(totalCost)} <span className="text-xs font-normal text-zinc-400">/ {formatBRL(budgetLimit)}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className={cn("h-full transition-all", isOverBudget ? "bg-red-500" : percentUsed > 80 ? "bg-amber-500" : "bg-emerald-500")}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
            <span className={cn("text-[10px] font-bold tabular-nums", isOverBudget ? "text-red-600" : "text-zinc-500")}>
              {Math.round(percentUsed)}%
            </span>
          </div>
        </div>
      </div>
      {!isOverBudget && percentUsed > 0 && (
        <div className="ml-2 hidden border-l border-zinc-200 pl-3 dark:border-zinc-800 sm:block">
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Saldo Disponível</p>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatBRL(budgetLimit - totalCost)}
          </p>
        </div>
      )}
    </div>
  );
}
