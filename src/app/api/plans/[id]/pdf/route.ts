import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolvePlanUnitDisplayName } from "@/lib/action-plan-units";
import { escapeHtml } from "@/lib/escape-html";
import { buildPlanReport, UPCOMING_DAYS, type ReportItem } from "@/lib/plan-report";
import { STATUS_FAROL } from "@/types/action-plan";

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

    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    const r = buildPlanReport(items || [], plan.budget_limit, today);

    const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const date = (d: string | null) => (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—");
    const FAROL = {
      verde: { dot: "🟢", label: "No rumo", color: "#059669" },
      amarelo: { dot: "🟡", label: "Atenção", color: "#d97706" },
      vermelho: { dot: "🔴", label: "Crítico", color: "#dc2626" },
    }[r.farol];
    const list = (rows: ReportItem[], count: number, empty: string) =>
      rows.length === 0
        ? `<p class="empty">${empty}</p>`
        : `<table><thead><tr><th>#</th><th>Ação</th><th>Responsável</th><th>Prazo</th><th>Status</th></tr></thead><tbody>${rows
            .map(
              (i) => `<tr><td>${escapeHtml(i.number)}</td><td>${escapeHtml(i.action)}</td><td>${escapeHtml(i.responsible || "—")}</td><td>${date(i.planned_end)}</td><td>${escapeHtml(STATUS_FAROL[i.status]?.dot ?? "")} ${escapeHtml(STATUS_FAROL[i.status]?.label ?? i.status)}</td></tr>`,
            )
            .join("")}</tbody></table>${count > rows.length ? `<p class="more">+ ${count - rows.length} não listadas</p>` : ""}`;
    const f = r.finance;
    const finance = f.budget
      ? `<div class="bar"><div style="width:${Math.min(f.percentUsed ?? 0, 100)}%;background:${f.overBudget ? "#dc2626" : "#059669"}"></div></div>
         <p>${brl(f.totalCost)} de ${brl(f.budget)} (${f.percentUsed}%)${f.overBudget ? ` · <strong class="red">estourado em ${brl(f.totalCost - f.budget)}</strong>` : ` · saldo ${brl(f.budget - f.totalCost)}`}</p>`
      : `<p>Custo previsto ${brl(f.totalCost)} · plano sem orçamento definido</p>`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>${escapeHtml(plan.title)} - Relatório executivo</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; color: #18181b; padding: 1.5cm; max-width: 21cm; margin: 0 auto; }
  .header { border-bottom: 2px solid #18181b; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; }
  .header h1 { font-size: 18px; }
  .meta { font-size: 10px; color: #71717a; margin-top: 2px; }
  .farol { font-size: 13px; font-weight: 700; color: ${FAROL.color}; white-space: nowrap; }
  .kpi { display: flex; gap: 8px; margin-bottom: 14px; }
  .kpi div { flex: 1; border: 1px solid #e4e4e7; border-radius: 6px; padding: 8px; text-align: center; }
  .kpi b { display: block; font-size: 18px; }
  .kpi span { font-size: 9px; color: #71717a; }
  h2 { font-size: 12px; margin: 14px 0 6px; text-transform: uppercase; letter-spacing: .04em; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f4f4f5; text-align: left; padding: 4px 6px; font-size: 9px; text-transform: uppercase; color: #71717a; }
  td { padding: 4px 6px; border-bottom: 1px solid #f4f4f5; font-size: 10px; vertical-align: top; }
  .bar { height: 8px; background: #f4f4f5; border-radius: 4px; overflow: hidden; margin-bottom: 4px; }
  .bar div { height: 100%; }
  .red { color: #dc2626; }
  .empty, .more { color: #71717a; font-size: 10px; padding: 4px 0; }
  .hint { font-size: 10px; color: #71717a; margin-bottom: 10px; }
  .footer { margin-top: 18px; text-align: center; font-size: 9px; color: #a1a1aa; border-top: 1px solid #e4e4e7; padding-top: 6px; }
  @media print { body { padding: 0; } .hint { display: none; } }
</style></head>
<body>
  <p class="hint">Para salvar em PDF: Ctrl+P (⌘P no Mac) → Salvar como PDF.</p>
  <div class="header">
    <div>
      <h1>${escapeHtml(plan.title)}</h1>
      <div class="meta">${escapeHtml([unitLabel, plan.director, plan.goal].filter(Boolean).join(" · "))} · ${date(today)}</div>
    </div>
    <div class="farol">${FAROL.dot} ${FAROL.label}</div>
  </div>
  <div class="kpi">
    <div><b>${r.total}</b><span>Ações</span></div>
    <div><b style="color:#059669">${r.rate}%</b><span>Concluídas (${r.done})</span></div>
    <div><b style="color:#2563eb">${r.byStatus[4]}</b><span>Em andamento</span></div>
    <div><b style="color:#d97706">${r.byStatus[1] + r.byStatus[2]}</b><span>Não iniciadas / pendentes</span></div>
    <div><b style="color:#dc2626">${r.blockedCount}</b><span>Bloqueios</span></div>
  </div>
  <h2>Saúde financeira</h2>
  ${finance}
  <h2>Principais bloqueios</h2>
  ${list(r.blocked, r.blockedCount, "Nenhuma ação atrasada.")}
  <h2>Próximos vencimentos (${UPCOMING_DAYS} dias)</h2>
  ${list(r.upcoming, r.upcomingCount, "Nenhum prazo nos próximos 30 dias.")}
  <div class="footer">Gerado por PlanoCerto · powered by Ruphus</div>
</body></html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Página de impressão: sem scripts, mesmo que algo escape ao escapeHtml.
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  } catch (error) {
    console.error("[PDF export] Error:", error);
    return NextResponse.json({ error: "Erro ao gerar PDF." }, { status: 500 });
  }
}
