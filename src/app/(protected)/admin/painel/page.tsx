import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequesterScope } from "@/app/actions/_helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Building2, Users, ClipboardList, MapPin, Plus, Settings2 } from "lucide-react";

export const metadata: Metadata = { title: "Painel | PlanoCerto" };

const PLAN_BADGE: Record<string, { label: string; variant: "default" | "accent" | "muted" }> = {
  enterprise: { label: "Enterprise", variant: "default" },
  pro: { label: "Profissional", variant: "accent" },
  free: { label: "Gratuito", variant: "muted" },
};

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Building2;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-50 dark:bg-accent-950/30">
          <Icon className="h-5 w-5 text-accent-600 dark:text-accent-400" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{value}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {label}
            {hint ? <span className="text-zinc-400"> · {hint}</span> : null}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminPainelPage() {
  // Painel global do SaaS: exclusivo do super_admin.
  const scope = await getRequesterScope();
  if (!scope.isSuperAdmin) redirect("/admin/users");

  const adminClient = createAdminClient();
  const [tenantsRes, membersRes, unitsRes, usersRes, plansRes] = await Promise.all([
    adminClient.from("tenants").select("id, name, plan, active, max_units, created_at").order("name"),
    adminClient.from("tenant_members").select("tenant_id"),
    adminClient.from("units").select("tenant_id"),
    adminClient.from("profiles").select("id", { count: "exact", head: true }),
    adminClient.from("action_plans").select("id", { count: "exact", head: true }),
  ]);

  const tenants = tenantsRes.data ?? [];
  const memberCount = new Map<string, number>();
  for (const m of membersRes.data ?? []) {
    if (m.tenant_id) memberCount.set(m.tenant_id, (memberCount.get(m.tenant_id) ?? 0) + 1);
  }
  const unitCount = new Map<string, number>();
  for (const u of unitsRes.data ?? []) {
    if (u.tenant_id) unitCount.set(u.tenant_id, (unitCount.get(u.tenant_id) ?? 0) + 1);
  }

  const activeTenants = tenants.filter((t) => t.active).length;
  const totalUnits = (unitsRes.data ?? []).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Painel do Super Admin
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Visão global de todas as empresas do PlanoCerto.
          </p>
        </div>
        <Link
          href="/admin/tenants"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-600 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Nova empresa
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Building2} label="Empresas" value={tenants.length} hint={`${activeTenants} ativas`} />
        <Kpi icon={Users} label="Usuários" value={usersRes.count ?? 0} />
        <Kpi icon={ClipboardList} label="Planos de ação" value={plansRes.count ?? 0} />
        <Kpi icon={MapPin} label="Unidades" value={totalUnits} />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr className="text-left text-xs font-medium uppercase text-zinc-500">
                <th className="px-3 py-2">Empresa</th>
                <th className="px-3 py-2">Plano</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Membros</th>
                <th className="px-3 py-2 text-right">Unidades</th>
                <th className="px-3 py-2">Criada</th>
                <th className="px-3 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-sm text-zinc-500">
                    Nenhuma empresa cadastrada.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => {
                  const plan = PLAN_BADGE[t.plan] ?? PLAN_BADGE.free;
                  const units = unitCount.get(t.id) ?? 0;
                  const max = t.max_units as number | null;
                  const atLimit = max != null && units >= max;
                  return (
                    <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">{t.name}</td>
                      <td className="px-3 py-2">
                        <Badge variant={plan.variant}>{plan.label}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        {t.active ? (
                          <Badge variant="success">Ativa</Badge>
                        ) : (
                          <Badge variant="muted">Inativa</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-300">
                        {memberCount.get(t.id) ?? 0}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        <span className={atLimit ? "font-medium text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-300"}>
                          {units}
                          {max != null ? `/${max}` : ""}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-zinc-500">{formatDate(t.created_at)}</td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          href="/admin/tenants"
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:underline dark:text-accent-400"
                        >
                          <Settings2 className="h-3.5 w-3.5" /> Gerenciar
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
