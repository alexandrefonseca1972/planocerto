"use client";

import type { ActionItem } from "@/types/action-plan";
import { Circle, Clock, AlertTriangle, Play, CheckCircle2 } from "lucide-react";

export type FlatItem = ActionItem & { depth: number; children: FlatItem[] };

export function flattenItems(items: ActionItem[], depth = 0): FlatItem[] {
  const result: FlatItem[] = [];
  for (const item of items) {
    result.push({ ...item, depth, children: [] });
    if (item.children?.length) {
      result.push(...flattenItems(item.children as ActionItem[], depth + 1));
    }
  }
  return result;
}

export function flattenWithStatus(items: ActionItem[]): ActionItem[] {
  const r: ActionItem[] = [];
  for (const i of items) {
    r.push(i);
    if (i.children) r.push(...flattenWithStatus(i.children));
  }
  return r;
}

export function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

export function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function calculatePlanFinancials(items: ActionItem[], budgetLimit?: number) {
  const allItems = flattenWithStatus(items);
  const totalCost = allItems.reduce((acc, item) => acc + (Number(item.preco) || 0), 0);
  const isOverBudget = !!budgetLimit && budgetLimit > 0 && totalCost > budgetLimit;
  const percentUsed = budgetLimit && budgetLimit > 0 ? (totalCost / budgetLimit) * 100 : 0;

  return { totalCost, isOverBudget, percentUsed };
}

export function FarolIcon({ status }: { status: number }) {
  const cls = "h-3.5 w-3.5";
  switch (status) {
    case 1: return <Circle className={cls + " text-zinc-400"} />;
    case 2: return <Clock className={cls + " text-amber-500"} />;
    case 3: return <AlertTriangle className={cls + " text-red-500 animate-pulse"} />;
    case 4: return <Play className={cls + " text-blue-500"} />;
    case 5: return <CheckCircle2 className={cls + " text-emerald-500"} />;
    default: return <Circle className={cls + " text-zinc-400"} />;
  }
}
