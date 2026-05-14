"use client";

import { useState, useEffect } from "react";
import { X, Check, ClipboardList, Paperclip, MessageSquare, CircleHelp, History, GraduationCap, Layers, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { SectionLoading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";
import { sanitize } from "@/lib/sanitize";
import type { ActionItem, ActionPlanFormState, AuditEntry } from "@/types/action-plan";
import { STATUS_FAROL } from "@/types/action-plan";
import type { Area, Unit } from "@/types/catalog";
import { AttachmentSection } from "@/components/planos/attachment-section";
import { CommentSection } from "@/components/planos/comment-section";
import { flattenItems } from "@/components/planos/plan-utils";
import { 
  buildUnitPreview, 
  resolveInitialItemArea 
} from "@/components/planos/plan-item-form-helpers";
import { 
  buildMacroActionOptions, 
  orderParentGroupsByMacroCatalog, 
  isValidActionText 
} from "@/components/planos/planos-page-helpers";
import { suggest5W2H } from "@/app/actions/action-plan-ai";
import { getItemAuditLog } from "@/app/actions/action-plan";
import { formatAuditEntryDate, getAuditEntryMarker, getAuditEntrySummary, getAuditEntryTone } from "@/components/planos/item-history-helpers";
import { Sparkles, Loader2 } from "lucide-react";

interface ItemFormDialogProps {
  item: ActionItem | null;
  planId: string;
  items: ActionItem[];
  planUnit: string;
  catalogAreas?: Area[];
  catalogUnits?: Unit[];
  catalogTiposPa?: { id: string; name: string }[];
  catalogMacroAcoes?: { id: string; name: string }[];
  state: ActionPlanFormState;
  action: (p: FormData) => void;
  isPending: boolean;
  onClose: () => void;
  initialTab?: "modelo" | "anexos" | "comentarios" | "historico";
}

export function ItemFormDialog({
  item,
  planId,
  items,
  planUnit,
  catalogAreas = [],
  catalogUnits = [],
  catalogTiposPa = [],
  catalogMacroAcoes = [],
  state,
  action,
  isPending,
  onClose,
  initialTab = "modelo",
}: ItemFormDialogProps) {
  const [isGroup, setIsGroup] = useState(!item?.parent_id && !!item?.children?.length);
  const [tab, setTab] = useState<"modelo" | "anexos" | "comentarios" | "historico">(initialTab);
  const [actionText, setActionText] = useState(item?.action || "");
  const [whyText, setWhyText] = useState(item?.why || "");
  const [comoText, setComoText] = useState(item?.como || "");
  const [iaLoading, setIaLoading] = useState(false);
  const [parentId, setParentId] = useState(item?.parent_id || "");
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const handleAiSuggest = async () => {
    if (!actionText || actionText.trim().length < 5) return;
    setIaLoading(true);
    try {
      const result = await suggest5W2H(actionText, planId);
      if (result.why) setWhyText(result.why);
      if (result.how) setComoText(result.how);
    } catch (error) {
      console.error("AI Suggest Error:", error);
    } finally {
      setIaLoading(false);
    }
  };

  const allItems = flattenItems(items);
  const groups = orderParentGroupsByMacroCatalog(
    allItems.filter((i) => i.id !== item?.id && (i.children?.length || 0) > 0),
    catalogMacroAcoes,
  );

  const currentMacroAcao = parentId ? allItems.find((currentItem) => currentItem.id === parentId)?.action || "" : "";
  const derivedArea = resolveInitialItemArea({
    itemArea: item?.area,
    planUnit,
    catalogAreas,
    catalogUnits,
  });

  const [selectedMacroAcao, setSelectedMacroAcao] = useState(currentMacroAcao);
  const [selectedArea, setSelectedArea] = useState(derivedArea);

  const areaOptions = catalogAreas.map((area) => area.name);
  const macroActionOptions = buildMacroActionOptions(groups, catalogMacroAcoes);
  const canSelectArea = catalogAreas.length > 0;
  const canViewUnitField = catalogUnits.length > 0;

  const unitPreview = buildUnitPreview({
    selectedArea,
    planUnit,
    catalogAreas,
    catalogUnits,
  });

  const modelProgressFields =
    [
      item?.tipo_pa || "",
      selectedArea,
      item?.prioridade || "",
      selectedMacroAcao,
      actionText,
      whyText,
      comoText,
      item?.responsible || "",
      item?.planned_end || "",
    ].filter((value) => String(value || "").trim().length > 0).length + (isGroup ? 1 : 0);
  const modelProgressTotal = 10;
  const modelProgress = Math.round((modelProgressFields / modelProgressTotal) * 100);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedMacroAcao(currentMacroAcao);
  }, [currentMacroAcao]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedArea(derivedArea);
  }, [derivedArea]);

  useEffect(() => {
    if (tab !== "historico" || !item?.id) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuditLoading(true);
    getItemAuditLog(item.id)
      .then((entries) => {
        if (!cancelled) setAuditEntries(entries);
      })
      .finally(() => {
        if (!cancelled) setAuditLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, item?.id]);

  return (
    <Modal onClose={onClose}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full border-zinc-300 bg-white/80 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300"
          >
            {item ? "Editar ação" : "Nova ação"}
          </Badge>
          <div>
            <h3 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              {item ? "Editar ação" : "Criar ação"}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Organize a ação por blocos. Preencha primeiro a classificação e depois a execução.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <form action={action} className="space-y-5 max-h-[76vh] overflow-y-auto pr-1">
        {item && <input type="hidden" name="itemId" value={item.id} />}
        <input type="hidden" name="planId" value={planId} />
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {item ? "Ajuste os dados da ação" : "Preencha os dados principais da ação"}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Comece pela classificação. Os demais blocos podem ser preenchidos em seguida.
              </p>
            </div>
            <div className="min-w-[150px]">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400">Preenchimento</span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {modelProgressFields}/{modelProgressTotal}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    modelProgress >= 75 ? "bg-emerald-500" : modelProgress >= 40 ? "bg-blue-500" : "bg-zinc-400",
                  )}
                  style={{ width: `${Math.max(modelProgress, 4)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 rounded-2xl bg-zinc-100/90 p-1.5 dark:bg-zinc-800/90">
          {(["modelo", "anexos", "comentarios", "historico"] as const).map((t) => {
            const needsItem = t === "anexos" || t === "comentarios" || t === "historico";
            const isDisabled = needsItem && !item?.id;
            const labels: Record<typeof t, string> = {
              modelo: "Modelo oficial",
              anexos: "Anexos",
              comentarios: "Comentários",
              historico: "Histórico",
            };
            const icons: Record<typeof t, React.ReactNode> = {
              modelo: <ClipboardList className="h-3.5 w-3.5" />,
              anexos: <Paperclip className="h-3.5 w-3.5" />,
              comentarios: <MessageSquare className="h-3.5 w-3.5" />,
              historico: <History className="h-3.5 w-3.5" />,
            };
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                disabled={isDisabled}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                  tab === t
                    ? "bg-white text-zinc-900 shadow-[0_2px_10px_rgba(15,23,42,0.08)] dark:bg-zinc-700 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300",
                  isDisabled ? "opacity-40 cursor-not-allowed" : "",
                )}
              >
                {icons[t]}
                {labels[t]}
              </button>
            );
          })}
        </div>
        {tab === "modelo" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Classificação</p>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-500">Tipo PA</Label>
                  <Select
                    name="tipo_pa"
                    defaultValue={item?.tipo_pa || ""}
                    className="h-12 rounded-xl border-zinc-200 bg-white text-base shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                    icon={<GraduationCap className="h-4 w-4" />}
                  >
                    <option value="">—</option>
                    {catalogTiposPa.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                    {catalogTiposPa.length === 0 &&
                      ["Processo Seletivo", "Vestibular", "Concurso", "ENEM", "Transferência", "Pós-Graduação", "Extensão", "Outro"].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                  </Select>
                </div>
                {canSelectArea ? (
                  <>
                    <Field
                      label="Área"
                      name="area"
                      value={selectedArea}
                      onChange={setSelectedArea}
                      placeholder="Ex.: PARÁ-AMAPÁ"
                      list="area-options"
                    />
                    <datalist id="area-options">
                      {areaOptions.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  </>
                ) : (
                  <input type="hidden" name="area" value={derivedArea} />
                )}
                {canViewUnitField && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Unidades disponíveis</Label>
                    <Select
                      value={
                        unitPreview.filteredUnitsForArea.some(
                          (unit) => unit.name.trim().toLowerCase() === planUnit.trim().toLowerCase(),
                        )
                          ? planUnit
                          : ""
                      }
                      aria-label="Lista de unidades disponíveis"
                      className={cn(
                        "h-12 rounded-xl border-zinc-200 bg-white text-base shadow-sm dark:border-zinc-700 dark:bg-zinc-900",
                        unitPreview.tone === "warning" && "border-amber-300 focus-visible:ring-amber-500",
                      )}
                      disabled={unitPreview.filteredUnitsForArea.length === 0}
                      onChange={() => undefined}
                    >
                      {!unitPreview.filteredUnitsForArea.some(
                        (unit) => unit.name.trim().toLowerCase() === planUnit.trim().toLowerCase(),
                      ) && (
                        <option value="">
                          {unitPreview.filteredUnitsForArea.length === 0
                            ? "Nenhuma unidade acessível"
                            : "Selecione uma unidade da lista"}
                        </option>
                      )}
                      {unitPreview.filteredUnitsForArea.map((unit) => (
                        <option key={unit.id} value={unit.name}>
                          {unit.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(240px,0.75fr)]">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-500">Prioridade</Label>
                  <Select
                    name="prioridade"
                    defaultValue={item?.prioridade || ""}
                    className="h-12 rounded-xl border-zinc-200 bg-white text-base shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                    icon={<Flag className="h-4 w-4" />}
                  >
                    <option value="">—</option>
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-medium text-zinc-500">Macro ação / Grupo pai</Label>
                    {!isGroup && macroActionOptions.length > 0 && (
                      <Tooltip
                        content="Selecione uma macro ação do catálogo. Se o grupo ainda não existir no plano, ele será criado automaticamente."
                        side="top"
                        delay={150}
                      >
                        <button
                          type="button"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
                          aria-label="Ajuda sobre macro ação"
                        >
                          <CircleHelp className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                  <input type="hidden" name="parent_id" value={isGroup ? "" : parentId} />
                  <Select
                    name="macro_acao"
                    value={isGroup ? "" : selectedMacroAcao}
                    onChange={(e) => {
                      const nextMacro = e.target.value;
                      setSelectedMacroAcao(nextMacro);
                      const matchedOption = macroActionOptions.find((option) => option.value === nextMacro);
                      setParentId(matchedOption?.parentId || "");
                    }}
                    disabled={isGroup}
                    className="h-12 rounded-xl border-zinc-200 bg-white text-base shadow-sm disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900"
                    icon={<Layers className="h-4 w-4" />}
                  >
                    <option value="">{isGroup ? "(este é um grupo)" : "Nenhum — item raiz"}</option>
                    {macroActionOptions.map((option) => (
                      <option key={`${option.value}-${option.parentId || "new"}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="block text-xs font-medium text-zinc-500">Estrutura</Label>
                  <Tooltip content="Use quando esta ação for apenas um agrupador." side="top" delay={150}>
                    <label className="flex h-12 cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900">
                      <input
                        type="checkbox"
                        checked={isGroup}
                        onChange={(e) => setIsGroup(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Criar como grupo</span>
                    </label>
                  </Tooltip>
                </div>
              </div>
              {(!canSelectArea || !canViewUnitField) && (
                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400">
                  {!canSelectArea && derivedArea ? `Área aplicada automaticamente: ${derivedArea}. ` : ""}
                  {!canViewUnitField && planUnit ? `Unidade do plano: ${planUnit}.` : ""}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Execução</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="Nº"
                  name="number"
                  value={item?.number || String(allItems.length + 1)}
                  placeholder="1.1"
                  required
                />
                <Field
                  label="Ordem"
                  name="sort_order"
                  value={String(item?.sort_order || allItems.length + 1)}
                  type="number"
                />
                <Field label="Subação" name="subacao" value={item?.subacao || ""} placeholder="Detalhamento da ação" />
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium text-zinc-500">
                      Ação <span className="text-red-500">*</span>
                    </Label>
                    <span className="inline-flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled
                        className="h-6 gap-1 px-1.5 text-[10px] font-bold text-zinc-400 cursor-not-allowed opacity-50"
                      >
                        <Sparkles className="h-3 w-3" />
                        SUGERIR COM IA
                      </Button>
                      <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                        Em breve
                      </span>
                    </span>
                  </div>
                  <span
                    className={cn(
                      "font-mono text-xs transition-colors",
                      actionText.length > 500
                        ? "text-red-500 font-semibold"
                        : actionText.length > 480
                        ? "text-amber-500"
                        : "text-zinc-400",
                    )}
                  >
                    {actionText.length}/500
                  </span>
                </div>
                <textarea
                  name="action"
                  value={actionText}
                  required
                  rows={3}
                  onChange={(e) => {
                    const v = sanitize(e.target.value);
                    setActionText(v);
                  }}
                  placeholder="Descreva a ação principal com clareza e objetividade"
                  className={cn(
                    "flex w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 resize-none transition-all",
                    actionText.length > 0 && actionText.length < 3
                      ? "border-red-300 focus-visible:ring-red-500"
                      : actionText.length > 500
                      ? "border-red-300 focus-visible:ring-red-500"
                      : "border-zinc-200 focus-visible:ring-zinc-500 dark:border-zinc-700",
                  )}
                />
                {actionText.length > 0 && actionText.length < 3 && (
                  <p className="text-[11px] text-red-500 animate-[slideDown_150ms_ease-out]">Mínimo 3 caracteres</p>
                )}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-500">Por quê? (Justificativa)</Label>
                  <textarea
                    name="why"
                    value={whyText}
                    onChange={(e) => setWhyText(sanitize(e.target.value))}
                    rows={4}
                    placeholder="Justifique a importância desta ação"
                    className="flex w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-500">Como? (Método)</Label>
                  <textarea
                    name="como"
                    value={comoText}
                    onChange={(e) => setComoText(sanitize(e.target.value))}
                    rows={4}
                    placeholder="Descreva como a ação será executada"
                    className="flex w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 resize-none"
                  />
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Onde?" name="where" value={item?.where || ""} placeholder="Nome do local" />
                <Field label="Quem?" name="responsible" value={item?.responsible || ""} placeholder="Nome do responsável" />
                <Field label="Quanto (R$)" name="cost" value={item?.cost || ""} placeholder="0,00" />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Resultados</p>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-zinc-500">Inscritos</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Esperado"
                      name="inscritos_esperado"
                      value={String(item?.inscritos_esperado ?? "")}
                      type="number"
                      placeholder="0"
                    />
                    <Field
                      label="Real"
                      name="inscritos_real"
                      value={String(item?.inscritos_real ?? "")}
                      type="number"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-zinc-500">Matrícula financeira</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Esperado"
                      name="mat_fin_esperado"
                      value={String(item?.mat_fin_esperado ?? "")}
                      type="number"
                      placeholder="0"
                    />
                    <Field
                      label="Real"
                      name="mat_fin_real"
                      value={String(item?.mat_fin_real ?? "")}
                      type="number"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-zinc-500">Matrícula acadêmica</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Esperado"
                      name="mat_acad_esperado"
                      value={String(item?.mat_acad_esperado ?? "")}
                      type="number"
                      placeholder="0"
                    />
                    <Field
                      label="Real"
                      name="mat_acad_real"
                      value={String(item?.mat_acad_real ?? "")}
                      type="number"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Cronograma</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Início previsto" name="planned_start" value={item?.planned_start || ""} type="date" />
                <Field label="Término previsto" name="planned_end" value={item?.planned_end || ""} type="date" />
                <Field label="Início real" name="actual_start" value={item?.actual_start || ""} type="date" />
                <Field label="Término real" name="actual_end" value={item?.actual_end || ""} type="date" />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Farol e acompanhamento</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-500">Farol</Label>
                  <Select
                    name="status"
                    defaultValue={String(item?.status || 1)}
                    className="h-12 rounded-xl border-zinc-200 bg-white text-base shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {Object.entries(STATUS_FAROL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.dot} {v.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-500">Macro ação selecionada</Label>
                  <Input
                    value={currentMacroAcao}
                    readOnly
                    placeholder="Definida pelo grupo pai selecionado"
                    className="h-12 rounded-xl bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  />
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <Label className="text-xs font-medium text-zinc-500">Acompanhamento / observações</Label>
                <textarea
                  name="observations"
                  defaultValue={item?.observations || ""}
                  rows={4}
                  placeholder="Registre observações, andamento e bloqueios"
                  className="flex w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 resize-none"
                />
              </div>
            </div>
          </div>
        )}
        {tab === "anexos" && (
          <div className="space-y-3">
            {item?.id ? (
              <AttachmentSection itemId={item.id} />
            ) : (
              <p className="text-xs text-zinc-400 text-center py-4">Salve o item antes de anexar arquivos.</p>
            )}
          </div>
        )}
        {tab === "comentarios" && (
          <div className="space-y-3">
            {item?.id ? (
              <CommentSection itemId={item.id} />
            ) : (
              <p className="text-xs text-zinc-400 text-center py-4">Salve o item antes de adicionar comentários.</p>
            )}
          </div>
        )}
        {tab === "historico" && (
          <div className="space-y-3">
            {!item?.id ? (
              <p className="text-xs text-zinc-400 text-center py-4">Salve o item antes de consultar o histórico.</p>
            ) : auditLoading ? (
              <SectionLoading message="Carregando histórico do item..." />
            ) : auditEntries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Nenhuma alteração registrada para este item até agora.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="space-y-2 p-4">
                  {auditEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-700 dark:bg-zinc-900/80"
                    >
                      <span className={cn("mt-0.5 text-sm font-bold", getAuditEntryTone(entry.action))}>
                        {getAuditEntryMarker(entry.action)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {getAuditEntrySummary(entry)}
                          </p>
                          <Badge variant="outline" className="text-[10px]">
                            {entry.user_name || "Usuário"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {formatAuditEntryDate(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
        {state.message && !state.success && tab === "modelo" && <Msg message={state.message} />}
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-zinc-200 bg-white/95 pt-3 pb-1 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
          <Button type="button" variant="outline" onClick={onClose}>
            {tab === "anexos" || tab === "comentarios" ? "Fechar" : "Cancelar"}
          </Button>
          {tab === "modelo" && (
            <Button type="submit" isLoading={isPending} disabled={!isValidActionText(actionText)}>
              <Check className="h-4 w-4 mr-1" />
              {item ? "Salvar ação" : "Criar ação"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
      onClick={onClose}
    >
      <div
        className="max-h-[min(92vh,860px)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl animate-[slideUp_200ms_ease-out] dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  multiline,
  required,
  placeholder,
  type,
  max,
  list,
  disabled,
}: {
  label: string;
  name: string;
  value?: string;
  onChange?: (v: string) => void;
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
  type?: string;
  max?: number;
  list?: string;
  disabled?: boolean;
}) {
  const controlled = typeof onChange === "function";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        {max && (
          <span className={cn("font-mono text-xs", (value?.length || 0) > max - 10 ? "text-red-500" : "text-zinc-400")}>
            {value?.length || 0}/{max}
          </span>
        )}
      </div>
      {multiline ? (
        <textarea
          name={name}
          {...(controlled ? { value } : { defaultValue: value })}
          placeholder={placeholder}
          required={required}
          rows={2}
          disabled={disabled}
          onChange={(e) => {
            const v = sanitize(e.target.value);
            onChange?.(v);
          }}
          className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 resize-none transition-shadow focus:shadow-md"
        />
      ) : (
        <Input
          name={name}
          type={type}
          {...(controlled ? { value } : { defaultValue: value })}
          placeholder={placeholder}
          required={required}
          list={list}
          disabled={disabled}
          onChange={(e) => {
            const v = type !== "date" && type !== "number" ? sanitize(e.target.value) : e.target.value;
            onChange?.(v);
          }}
          className="transition-shadow focus:shadow-md"
        />
      )}
    </div>
  );
}

function Msg({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300">
      {message}
    </div>
  );
}
