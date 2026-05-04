import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertTriangle, Play, Circle } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard | PlanoCerto" };

interface Params { params: Promise<{ token: string }>; }

function FarolIcon({ status }: { status: number }) {
  const c = "h-3.5 w-3.5";
  switch (status) {
    case 1: return <Circle className={c + " text-zinc-400"} />;
    case 2: return <Clock className={c + " text-amber-500"} />;
    case 3: return <AlertTriangle className={c + " text-red-500 animate-pulse"} />;
    case 4: return <Play className={c + " text-blue-500"} />;
    case 5: return <CheckCircle2 className={c + " text-emerald-500"} />;
    default: return <Circle className={c + " text-zinc-400"} />;
  }
}

export default async function PublicDashboard({ params }: Params) {
  const { token } = await params;

  let planTitle = "";
  let total = 0, completed = 0, inProgress = 0, overdue = 0;
  const items: { id: string; number: string; action: string; responsible: string; status: number; planned_end: string | null }[] = [];
  let error = "";

  try {
    const supabase = await createClient();

    // Validate the token
    const { data: link } = await supabase.from("public_links").select("plan_id, expires_at").eq("token", token).maybeSingle();
    if (!link) { error = "Link inválido ou não encontrado."; throw null; }
    if (link.expires_at && new Date(link.expires_at) < new Date()) { error = "Este link expirou."; throw null; }

    // Get plan
    const { data: plan } = await supabase.from("action_plans").select("title").eq("id", link.plan_id).single();
    if (!plan) { error = "Plano não encontrado."; throw null; }
    planTitle = plan.title;

    // Get items
    const today = new Date().toISOString().split("T")[0];
    const { data: allItems } = await supabase.from("action_items").select("id,number,action,responsible,status,planned_end").eq("plan_id", link.plan_id).order("sort_order");

    for (const item of allItems || []) {
      items.push(item);
      total++;
      if (item.status === 5) completed++;
      else if (item.planned_end && item.planned_end < today) overdue++;
      else if (item.status === 3 || item.status === 4) inProgress++;
    }
  } catch { /* handled below */ }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <p className="text-zinc-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 select-none mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 7h6v6" /><path d="m22 7-8.5 8.5-5-5L2 17" /></svg>
            </div>
            <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">PlanoCerto</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{planTitle}</h1>
          <p className="text-sm text-zinc-500">Dashboard público</p>
        </div>

        {/* KPI Row */}
        <div className="grid gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{total}</p>
              <p className="text-xs text-zinc-500">Total de ações</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{completionRate}%</p>
              <p className="text-xs text-zinc-500">Concluídas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{inProgress}</p>
              <p className="text-xs text-zinc-500">Em andamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{overdue}</p>
              <p className="text-xs text-zinc-500">Atrasadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Items Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Ações</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">#</th>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Ação</th>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Responsável</th>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Prazo</th>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {items.map(item => (
                    <tr key={item.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">{item.number}</td>
                      <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-50">{item.action}</td>
                      <td className="px-4 py-2.5 text-xs text-zinc-600">{item.responsible || "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-zinc-600">{item.planned_end ? new Date(item.planned_end + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="px-4 py-2.5"><FarolIcon status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-400">
          Powered by <strong>PlanoCerto</strong> · Ruphus
        </p>
      </div>
    </div>
  );
}
