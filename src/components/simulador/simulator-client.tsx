"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/lib/contexts/tenant-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  getScenarios,
  getScenarioMetrics,
  upsertScenario,
  deleteScenario,
  upsertMetric,
} from "@/app/actions/simulator";
import type {
  SimulatorScenario,
  SimulatorChannelMetric,
  SimulatorFormState,
  SimulatorChannelRow,
} from "@/types/simulator";
import { computeChannelDerived } from "@/types/simulator";
import type { Channel, Unit } from "@/types/catalog";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Calculator,
  Search,
  Star,
  Users,
  CreditCard,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const init: SimulatorFormState = { message: undefined, errors: {} };
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function SimulatorClient({ channels, units }: { channels: Channel[]; units: Unit[] }) {
  const { currentTenant } = useTenant();
  const router = useRouter();
  const { toast } = useToast();

  const [scenarios, setScenarios] = useState<SimulatorScenario[]>([]);
  const [active, setActive] = useState<SimulatorScenario | null>(null);
  const [metrics, setMetrics] = useState<SimulatorChannelMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SimulatorScenario | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  const [upsertState, upsertAction, isSaving] = useActionState(upsertScenario, init);
  const [, deleteAction] = useActionState(deleteScenario, init);

  useEffect(() => {
    if (!currentTenant?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await getScenarios(currentTenant.id);
      if (!cancelled) {
        setScenarios(data);
        setActive(data[0] || null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentTenant]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!active?.id) {
      setMetrics([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const data = await getScenarioMetrics(active.id);
      if (!cancelled) setMetrics(data);
    })();
    return () => {
      cancelled = true;
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [active]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (upsertState.success) {
      toast(upsertState.message || "Salvo!");
      setShowForm(false);
      setEditing(null);
      router.refresh();
      if (currentTenant?.id) {
        getScenarios(currentTenant.id).then((data) => {
          setScenarios(data);
          if (!active) setActive(data[0] || null);
        });
      }
    } else if (upsertState.message && !upsertState.success) {
      toast(upsertState.message, "error");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upsertState]);

  const rows: SimulatorChannelRow[] = useMemo(() => {
    const byChannel = new Map(metrics.map((m) => [m.channel_id, m]));
    return computeChannelDerived(
      channels.map((c) => ({
        channel_id: c.id,
        channel_name: c.name,
        inscritos: byChannel.get(c.id)?.inscritos ?? 0,
        mat_financeira: byChannel.get(c.id)?.mat_financeira ?? 0,
        mat_academica: byChannel.get(c.id)?.mat_academica ?? 0,
      })),
    );
  }, [channels, metrics]);

  const totals = useMemo(() => {
    const t = rows.reduce(
      (a, r) => ({
        in: a.in + r.inscritos,
        mf: a.mf + r.mat_financeira,
        ma: a.ma + r.mat_academica,
      }),
      { in: 0, mf: 0, ma: 0 },
    );
    return {
      ...t,
      conv_in_mf: t.in > 0 ? t.mf / t.in : 0,
      conv_mf_ma: t.mf > 0 ? t.ma / t.mf : 0,
    };
  }, [rows]);

  function handleMetricChange(
    channelId: string,
    field: "inscritos" | "mat_financeira" | "mat_academica",
    value: number,
  ) {
    if (!active) return;
    setMetrics((prev) => {
      const idx = prev.findIndex((m) => m.channel_id === channelId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], [field]: value };
        return next;
      }
      return [
        ...prev,
        {
          id: `temp-${channelId}`,
          scenario_id: active.id,
          channel_id: channelId,
          inscritos: 0,
          mat_financeira: 0,
          mat_academica: 0,
          created_at: "",
          updated_at: "",
          [field]: value,
        } as SimulatorChannelMetric,
      ];
    });
  }

  function persistMetric(channelId: string) {
    if (!active) return;
    const m = metrics.find((x) => x.channel_id === channelId);
    if (!m) return;
    startTransition(async () => {
      const res = await upsertMetric(active.id, channelId, {
        inscritos: m.inscritos,
        mat_financeira: m.mat_financeira,
        mat_academica: m.mat_academica,
      });
      if (!res.success && res.message) toast(res.message, "error");
    });
  }

  const [deletingScenario, setDeletingScenario] = useState<SimulatorScenario | null>(null);
  const [scenarioFilter, setScenarioFilter] = useState("");

  function confirmDelete() {
    if (!deletingScenario) return;
    const fd = new FormData();
    fd.set("scenarioId", deletingScenario.id);
    deleteAction(fd);
    setScenarios((prev) => prev.filter((s) => s.id !== deletingScenario.id));
    if (active?.id === deletingScenario.id) setActive(null);
    toast("Cenário excluído.");
    setDeletingScenario(null);
  }

  // Cenários filtrados pela busca
  const filteredScenarios = useMemo(() => {
    const q = scenarioFilter.trim().toLowerCase();
    if (!q) return scenarios;
    return scenarios.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.reference_label || "").toLowerCase().includes(q),
    );
  }, [scenarios, scenarioFilter]);

  // Agrupa cenários por categoria automaticamente baseado no nome
  const groupedScenarios = useMemo(() => {
    const groups = new Map<string, SimulatorScenario[]>();
    const baseline: SimulatorScenario[] = [];
    for (const s of filteredScenarios) {
      if (s.is_baseline) baseline.push(s);
      const m = s.name.match(/^(\d{4}\.\d|Q[1-4]|Plano|Simulação|Cenário|Mid|Pré|Closure|Forecast|Reforço)/i);
      const cat = m ? m[1].toUpperCase() : "Outros";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(s);
    }
    return { baseline, groups };
  }, [filteredScenarios]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Calculator className="h-6 w-6 text-accent-600" /> Simulador de Metas
          </h1>
          <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Funil por canal: Inscritos → Mat. Financeira → Mat. Acadêmica
            <Badge variant="muted">
              {scenarios.length} cenário{scenarios.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" /> Novo Cenário
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : scenarios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calculator className="mx-auto mb-3 h-10 w-10 text-zinc-400" />
            <p className="text-sm text-zinc-500">Nenhum cenário criado.</p>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" /> Criar primeiro cenário
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Seletor de cenários: busca + agrupamento compacto */}
          <Card>
            <CardContent className="space-y-3 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <Input
                    value={scenarioFilter}
                    onChange={(e) => setScenarioFilter(e.target.value)}
                    placeholder="Buscar cenário..."
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                <span className="text-[11px] text-zinc-500">
                  {filteredScenarios.length} de {scenarios.length}
                </span>
              </div>

              {filteredScenarios.length === 0 ? (
                <p className="py-3 text-center text-xs italic text-zinc-400">
                  {scenarioFilter
                    ? `Nenhum cenário com "${scenarioFilter}"`
                    : "Nenhum cenário"}
                </p>
              ) : (
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {Array.from(groupedScenarios.groups.entries()).map(([cat, list]) => (
                    <div key={cat}>
                      <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                        {cat}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {list.map((s) => {
                          const isActive = active?.id === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setActive(s)}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all",
                                isActive
                                  ? "border-brand-600 bg-brand-600 text-white shadow-sm dark:border-brand-300 dark:bg-brand-200 dark:text-brand-900"
                                  : "border-zinc-200 bg-white text-zinc-700 hover:border-accent-400 hover:bg-accent-50/40 hover:text-accent-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-accent-400 dark:hover:bg-accent-950/30",
                              )}
                              aria-pressed={isActive}
                            >
                              {s.is_baseline && (
                                <Star
                                  className={cn(
                                    "h-2.5 w-2.5",
                                    isActive
                                      ? "fill-white text-white dark:fill-brand-900"
                                      : "fill-amber-500 text-amber-500",
                                  )}
                                />
                              )}
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {active && (
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-lg font-semibold">{active.name}</h2>
                      {active.is_baseline && (
                        <Badge variant="warning" className="gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          Base
                        </Badge>
                      )}
                    </div>
                    {active.reference_label && (
                      <p className="text-xs text-zinc-500">{active.reference_label}</p>
                    )}
                    <p className="mt-1 text-xs text-zinc-500">
                      Previsão vs Real AA:{" "}
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {fmtPct(active.meta_real_aa)}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(active);
                        setShowForm(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingScenario(active)}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      aria-label="Excluir cenário"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Stats summary */}
                <div className="grid grid-cols-3 gap-2">
                  <SummaryCard
                    icon={<Users className="h-4 w-4" />}
                    label="Inscritos"
                    value={totals.in}
                    color="accent"
                  />
                  <SummaryCard
                    icon={<CreditCard className="h-4 w-4" />}
                    label="Mat. Financeira"
                    value={totals.mf}
                    color="blue"
                  />
                  <SummaryCard
                    icon={<GraduationCap className="h-4 w-4" />}
                    label="Mat. Acadêmica"
                    value={totals.ma}
                    color="emerald"
                  />
                </div>

                <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-700">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                      <tr className="text-left text-xs font-medium uppercase text-zinc-500">
                        <th className="px-3 py-2">Canal</th>
                        <th className="px-3 py-2 text-right">IN</th>
                        <th className="px-3 py-2 text-right">MF</th>
                        <th className="px-3 py-2 text-right">MA</th>
                        <th className="px-3 py-2 text-right">Share</th>
                        <th className="px-3 py-2 text-right">IN→MF</th>
                        <th className="px-3 py-2 text-right">MF→MA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {rows.map((r) => (
                        <tr key={r.channel_id}>
                          <td className="px-3 py-1.5 font-medium">{r.channel_name}</td>
                          <td className="px-1 py-1 text-right">
                            <Input
                              type="number"
                              min="0"
                              value={r.inscritos}
                              onChange={(e) =>
                                handleMetricChange(
                                  r.channel_id,
                                  "inscritos",
                                  Number(e.target.value) || 0,
                                )
                              }
                              onBlur={() => persistMetric(r.channel_id)}
                              className="h-8 w-24 text-right tabular-nums"
                            />
                          </td>
                          <td className="px-1 py-1 text-right">
                            <Input
                              type="number"
                              min="0"
                              value={r.mat_financeira}
                              onChange={(e) =>
                                handleMetricChange(
                                  r.channel_id,
                                  "mat_financeira",
                                  Number(e.target.value) || 0,
                                )
                              }
                              onBlur={() => persistMetric(r.channel_id)}
                              className="h-8 w-24 text-right tabular-nums"
                            />
                          </td>
                          <td className="px-1 py-1 text-right">
                            <Input
                              type="number"
                              min="0"
                              value={r.mat_academica}
                              onChange={(e) =>
                                handleMetricChange(
                                  r.channel_id,
                                  "mat_academica",
                                  Number(e.target.value) || 0,
                                )
                              }
                              onBlur={() => persistMetric(r.channel_id)}
                              className="h-8 w-24 text-right tabular-nums"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums">
                            <ShareCell value={r.share} />
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums">
                            <ConvCell value={r.conv_in_mf} />
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums">
                            <ConvCell value={r.conv_mf_ma} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-50 font-semibold dark:bg-zinc-800/50">
                      <tr>
                        <td className="px-3 py-2 text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                          Total geral
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {totals.in.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {totals.mf.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {totals.ma.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-zinc-500">
                          100%
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          <ConvCell value={totals.conv_in_mf} />
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          <ConvCell value={totals.conv_mf_ma} />
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className="text-xs text-zinc-500">
                  Edite os campos IN, MF ou MA. Share, IN→MF e MF→MA são calculados.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {showForm && currentTenant && (
        <ScenarioForm
          scenario={editing}
          tenantId={currentTenant.id}
          units={units}
          action={upsertAction}
          state={upsertState}
          isSaving={isSaving}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <AlertDialog
        open={Boolean(deletingScenario)}
        onOpenChange={(open) => !open && setDeletingScenario(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cenário?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Confirma a exclusão de "${deletingScenario?.name}" e todas as suas métricas? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingScenario(null)}>
              Cancelar
            </AlertDialogCancel>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "accent" | "blue" | "emerald";
}) {
  const palette = {
    accent: {
      iconBg: "bg-accent-50 text-accent-700 dark:bg-accent-950/30 dark:text-accent-300",
    },
    blue: {
      iconBg: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    },
    emerald: {
      iconBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    },
  }[color];
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", palette.iconBg)}>
          {icon}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </span>
      </div>
      <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

function ShareCell({ value }: { value: number }) {
  // share alto = mais relevante; pinta o número proporcional ao volume
  const tone =
    value >= 0.15
      ? "text-brand-700 dark:text-brand-200 font-semibold"
      : value >= 0.05
      ? "text-zinc-700 dark:text-zinc-300"
      : "text-zinc-400 dark:text-zinc-500";
  return <span className={tone}>{fmtPct(value)}</span>;
}

function ConvCell({ value }: { value: number }) {
  // verde se conversão alta, âmbar se média, vermelho se baixa
  const tone =
    value >= 0.5
      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
      : value >= 0.25
      ? "text-blue-600 dark:text-blue-400"
      : value > 0
      ? "text-amber-600 dark:text-amber-400"
      : "text-zinc-400 dark:text-zinc-500";
  return (
    <span className={cn("inline-flex items-center justify-end gap-1", tone)}>
      {value >= 0.5 && <TrendingUp className="h-2.5 w-2.5" />}
      {fmtPct(value)}
    </span>
  );
}

function ScenarioForm({
  scenario,
  tenantId,
  units,
  action,
  state,
  isSaving,
  onClose,
}: {
  scenario: SimulatorScenario | null;
  tenantId: string;
  units: Unit[];
  action: (formData: FormData) => void;
  state: SimulatorFormState;
  isSaving: boolean;
  onClose: () => void;
}) {
  const e = state.errors || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-700">
          <h2 className="text-lg font-semibold">
            {scenario ? "Editar cenário" : "Novo cenário"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form action={action} className="space-y-3 p-6">
          <input type="hidden" name="tenantId" value={tenantId} />
          {scenario && <input type="hidden" name="scenarioId" value={scenario.id} />}

          <div className="space-y-1">
            <Label className="text-xs font-medium uppercase text-zinc-500">Nome*</Label>
            <Input name="name" defaultValue={scenario?.name || ""} required />
            {e.name?.[0] && <p className="text-xs text-red-600">{e.name[0]}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium uppercase text-zinc-500">
              Etiqueta de referência
            </Label>
            <Input
              name="reference_label"
              defaultValue={scenario?.reference_label || ""}
              placeholder='ex: "vs 25.3"'
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase text-zinc-500">
                Previsão vs Real AA
              </Label>
              <Input
                name="meta_real_aa"
                type="number"
                step="0.01"
                min="0"
                max="1"
                defaultValue={String(scenario?.meta_real_aa ?? 0.15)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase text-zinc-500">Unidade</Label>
              <select
                name="unit_id"
                defaultValue={scenario?.unit_id || ""}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">—</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 pt-1 text-sm">
            <input
              type="checkbox"
              name="is_baseline"
              defaultChecked={scenario?.is_baseline || false}
              className="h-4 w-4"
            />
            Cenário-base (referência)
          </label>
          <div className="space-y-1">
            <Label className="text-xs font-medium uppercase text-zinc-500">Notas</Label>
            <textarea
              name="notes"
              defaultValue={scenario?.notes || ""}
              rows={3}
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          {state.message && !state.success && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              {state.message}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSaving}>
              <Save className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
