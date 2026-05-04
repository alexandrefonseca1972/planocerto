"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { ActionItem } from "@/types/action-plan";

function flattenItems(items: ActionItem[]): ActionItem[] {
  const r: ActionItem[] = [];
  for (const i of items) { r.push(i); if (i.children) r.push(...flattenItems(i.children)); }
  return r;
}

export function ExportCsv({ items, filename }: { items: ActionItem[]; filename: string }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const XLSX = await import("xlsx");
      const flat = flattenItems(items);
      const farol = ["", "Não Iniciada", "Pendente", "Em andamento (atraso)", "Em andamento", "Concluído"];

      const headers = ["Nº", "Ação (O QUE / COMO)", "Por Que", "Onde", "Responsável", "Início Prev", "Término Prev", "Início Real", "Término Real", "Custo (R$)", "Resultado Esperado", "Resultado Real", "Farol", "Observações"];
      const rows = flat.map(item => [
        item.number, item.action, item.why, item.where, item.responsible,
        item.planned_start ? new Date(item.planned_start + "T00:00:00").toLocaleDateString("pt-BR") : "",
        item.planned_end ? new Date(item.planned_end + "T00:00:00").toLocaleDateString("pt-BR") : "",
        item.actual_start ? new Date(item.actual_start + "T00:00:00").toLocaleDateString("pt-BR") : "",
        item.actual_end ? new Date(item.actual_end + "T00:00:00").toLocaleDateString("pt-BR") : "",
        item.cost, item.expected_result, item.actual_result,
        farol[item.status] || "", item.observations,
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = [
        { wch: 6 }, { wch: 45 }, { wch: 30 }, { wch: 25 }, { wch: 20 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 30 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Plano de Ação");
      XLSX.writeFile(wb, `${filename.replace(/[^a-z0-9]/gi, "_")}.xlsx`);
    } catch (e) {
      console.error("Erro ao exportar:", e);
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
