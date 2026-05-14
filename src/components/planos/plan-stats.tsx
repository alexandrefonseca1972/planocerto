"use client";

import { Columns3, GanttChart as GanttIcon, Table2, History, EyeOff, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActionItem } from "@/types/action-plan";

interface PlanStatsProps {
  counts: {
    total: number;
    done: number;
    progress: number;
    pending: number;
  };
  viewMode: "table" | "kanban" | "gantt";
  setViewMode: (mode: "table" | "kanban" | "gantt") => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  setShowUploadDialog: (show: boolean) => void;
  setShowItemForm: (show: boolean) => void;
  setEditingItem: (item: ActionItem | null) => void;
}

export function PlanStats({
  counts,
  viewMode,
  setViewMode,
  showHistory,
  setShowHistory,
  setShowUploadDialog,
  setShowItemForm,
  setEditingItem,
}: PlanStatsProps) {
  const toggleViewMode = () => {
    const modes: ("table" | "kanban" | "gantt")[] = ["table", "kanban", "gantt"];
    const idx = modes.indexOf(viewMode);
    const next = modes[(idx + 1) % 3];
    setViewMode(next);
    localStorage.setItem("planos-view", next);
  };

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-4">
          <StatPill color="bg-zinc-400" label="Total" value={counts.total} />
          <StatPill color="bg-blue-500" label="Em andamento" value={counts.progress} />
          <StatPill color="bg-emerald-500" label="Concluídas" value={counts.done} />
          <StatPill color="bg-amber-500" label="Pendentes" value={counts.pending} />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleViewMode} title="Alternar visualização">
              {viewMode === "table" ? (
                <Columns3 className="h-4 w-4 mr-1" />
              ) : viewMode === "kanban" ? (
                <GanttIcon className="h-4 w-4 mr-1" />
              ) : (
                <Table2 className="h-4 w-4 mr-1" />
              )}
              {viewMode === "table" ? "Kanban" : viewMode === "kanban" ? "Gantt" : "Tabela"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? <EyeOff className="h-4 w-4 mr-1" /> : <History className="h-4 w-4 mr-1" />}
              Histórico
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-3.5 w-3.5 mr-1" /> Importar Excel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingItem(null);
                setShowItemForm(true);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Nova ação
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatPill({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label} <span className="font-semibold text-zinc-900 dark:text-zinc-50">{value}</span>
    </span>
  );
}

