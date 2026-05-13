"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Download } from "lucide-react";
import type { ActionItem } from "@/types/action-plan";

function flattenItems(items: ActionItem[]): ActionItem[] {
  const r: ActionItem[] = [];
  for (const i of items) { r.push(i); if (i.children) r.push(...flattenItems(i.children)); }
  return r;
}

export function ExportCsv({ items, filename }: { items: ActionItem[]; filename: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      const XLSX = await import("xlsx");
      const flat = flattenItems(items);
      const farol = ["", "Não Iniciada", "Pendente", "Em andamento (atraso)", "Em andamento", "Concluído"];

      const d = (iso: string | null) =>
        iso ? new Date(iso + "T00:00:00").toLocaleDateString("pt-BR") : "";

      const headers = [
        "TIPO PA", "ÁREA", "PRIORIDADE",
        "MACRO AÇÃO", "AÇÃO", "SUBAÇÃO", "COMO?",
        "ONDE?", "QUEM?", "QUANTO (R$)",
        "INSCRITOS ESPERADO", "INSCRITOS REAL",
        "MAT. FINANCEIRA ESPERADO", "MAT. FINANCEIRA REAL",
        "MAT. ACADÊMICA ESPERADO", "MAT. ACADÊMICA REAL",
        "INÍCIO PREVISTO", "INÍCIO REAL",
        "TÉRMINO PREVISTO", "TÉRMINO REAL",
        "FAROL", "ACOMPANHAMENTO/OBSERVAÇÕES",
      ];

      const rows = flat.map(item => [
        item.tipo_pa ?? "", item.area ?? "", item.prioridade ?? "",
        item.parent_id ? "" : item.action, // MACRO AÇÃO = ação do grupo pai
        item.action, item.subacao ?? "", item.como ?? "",
        item.where, item.responsible, item.cost,
        item.inscritos_esperado ?? 0, item.inscritos_real ?? 0,
        item.mat_fin_esperado ?? 0, item.mat_fin_real ?? 0,
        item.mat_acad_esperado ?? 0, item.mat_acad_real ?? 0,
        d(item.planned_start), d(item.actual_start),
        d(item.planned_end), d(item.actual_end),
        farol[item.status] || "", item.observations,
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = [
        { wch: 14 }, { wch: 14 }, { wch: 10 },
        { wch: 30 }, { wch: 40 }, { wch: 30 }, { wch: 30 },
        { wch: 25 }, { wch: 20 }, { wch: 12 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 16 }, { wch: 35 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PLANO DE AÇÃO");
      XLSX.writeFile(wb, `${filename.replace(/[^a-z0-9]/gi, "_")}.xlsx`);
    } catch (e) {
      console.error("Erro ao exportar:", e);
      toast("Não foi possível exportar o arquivo. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} isLoading={loading}>
      <Download className="h-3.5 w-3.5 mr-1" /> XLSX
    </Button>
  );
}
