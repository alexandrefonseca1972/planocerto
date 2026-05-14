import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolvePlanUnitDisplayName } from "@/lib/action-plan-units";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    // Acesso ao plano e items é restrito por RLS (action_plans / action_items)
    // — usuário sem permissão recebe 404 abaixo.
    const { data: plan } = await supabase.from("action_plans").select("*").eq("id", id).single();
    if (!plan) return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });

    const unitLabel = await resolvePlanUnitDisplayName(supabase, {
      tenantId: plan.tenant_id,
      unitId: plan.unit_id,
      unitName: plan.unit,
    });

    const { data: items } = await supabase.from("action_items").select("*").eq("plan_id", id).order("sort_order");

    const completed = (items || []).filter(i => i.status === 5).length;
    const progress = (items || []).filter(i => i.status === 3 || i.status === 4).length;
    const pending = (items || []).filter(i => i.status === 1 || i.status === 2).length;
    const total = (items || []).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const statusLabel = (s: number) => ({ 1: "Não Iniciada", 2: "Pendente", 3: "Atrasada", 4: "Em Andamento", 5: "Concluída" }[s] || s);

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>${plan.title} - PlanoCerto</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; color: #18181b; padding: 2cm 1.5cm; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #18181b; padding-bottom: 12px; }
  .header h1 { font-size: 20px; margin-bottom: 4px; }
  .header .meta { font-size: 10px; color: #71717a; }
  .kpi { display: flex; gap: 12px; margin-bottom: 16px; }
  .kpi-card { flex:1; border:1px solid #e4e4e7; border-radius:8px; padding:10px; text-align:center; }
  .kpi-card .value { font-size: 22px; font-weight: 700; }
  .kpi-card .label { font-size: 9px; color: #71717a; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f4f4f5; text-align: left; padding: 6px 8px; font-size: 9px; text-transform: uppercase; color: #71717a; border-bottom: 1px solid #e4e4e7; }
  td { padding: 5px 8px; border-bottom: 1px solid #f4f4f5; font-size: 10px; }
  .done { color: #059669; }
  .footer { margin-top: 24px; text-align: center; font-size: 9px; color: #a1a1aa; border-top: 1px solid #e4e4e7; padding-top: 8px; }
  @media print { body { padding: 1cm; } }
</style></head>
<body>
  <div class="header">
    <h1>${plan.title}</h1>
    <div class="meta">${[unitLabel, plan.director, plan.goal].filter(Boolean).join(" · ")} · ${new Date().toLocaleDateString("pt-BR")}</div>
  </div>
  <div class="kpi">
    <div class="kpi-card"><div class="value">${total}</div><div class="label">Total</div></div>
    <div class="kpi-card"><div class="value" style="color:#059669">${rate}%</div><div class="label">Concluídas</div></div>
    <div class="kpi-card"><div class="value" style="color:#2563eb">${progress}</div><div class="label">Andamento</div></div>
    <div class="kpi-card"><div class="value" style="color:#d97706">${pending}</div><div class="label">Pendentes</div></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Ação</th><th>Responsável</th><th>Prazo</th><th>Status</th></tr></thead>
    <tbody>
      ${(items || []).map(i => `<tr>
        <td>${i.number}</td>
        <td>${i.action}</td>
        <td>${i.responsible || "—"}</td>
        <td>${i.planned_end ? new Date(i.planned_end + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
        <td class="${i.status === 5 ? "done" : ""}">${statusLabel(i.status)}</td>
      </tr>`).join("")}
    </tbody>
  </table>
  <div class="footer">Gerado por PlanoCerto · powered by Ruphus</div>
</body></html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("[PDF export] Error:", error);
    return NextResponse.json({ error: "Erro ao gerar PDF." }, { status: 500 });
  }
}
