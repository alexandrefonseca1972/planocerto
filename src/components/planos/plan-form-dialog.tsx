"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Save, Building2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { sanitize } from "@/lib/sanitize";
import type { ActionPlan, ActionPlanFormState } from "@/types/action-plan";
import type { Area, Unit } from "@/types/catalog";
import { getTemplates, createPlanFromTemplate } from "@/app/actions/shared";
import { 
  buildOfficialPlanHeader, 
  getPlanFormProgress, 
  normalizePlanFormValue, 
  resolvePlanTitle, 
  validatePlanFormDraft 
} from "@/components/planos/plan-form-helpers";

interface PlanFormDialogProps {
  plan: ActionPlan | null;
  tenantId: string;
  catalogUnits: Unit[];
  catalogAreas: Area[];
  state: ActionPlanFormState;
  action: (p: FormData) => void;
  isPending: boolean;
  onClose: () => void;
}

export function PlanFormDialog({
  plan,
  tenantId,
  catalogUnits,
  catalogAreas,
  state,
  action,
  isPending,
  onClose,
}: PlanFormDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState(normalizePlanFormValue(plan?.title));
  const [unit, setUnit] = useState(normalizePlanFormValue(plan?.unit));
  const [director, setDirector] = useState(normalizePlanFormValue(plan?.director));
  const [goal, setGoal] = useState(normalizePlanFormValue(plan?.goal));
  const [status, setStatus] = useState<"active" | "archived">(plan?.status || "active");
  const [exercicio, setExercicio] = useState(plan?.exercicio ? String(plan.exercicio) : "");
  const [budgetLimit, setBudgetLimit] = useState(
    typeof plan?.budget_limit === "number" ? String(plan.budget_limit) : "",
  );
  const [visibility, setVisibility] = useState<"public" | "restricted">(plan?.visibility || "public");
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [titleTouched, setTitleTouched] = useState(Boolean(plan?.title && plan?.title !== plan?.unit));

  useEffect(() => {
    if (!plan) {
      getTemplates().then((t) => setTemplates(t.map((x) => ({ id: x.id, name: x.name }))));
    }
  }, [plan]);

  const applyTemplate = async (templateId: string) => {
    setTemplateLoading(true);
    setTemplateError(null);
    const result = await createPlanFromTemplate(templateId, tenantId);
    if (result.success) {
      onClose();
      router.refresh();
    } else {
      setTemplateLoading(false);
      setTemplateError(result.message);
    }
  };

  const validation = validatePlanFormDraft({ title, unit, director, goal });
  const { fieldsFilled, totalFields, formProgress } = getPlanFormProgress({ title, unit, director, goal });
  const hasChanges =
    title !== normalizePlanFormValue(plan?.title) ||
    unit !== normalizePlanFormValue(plan?.unit) ||
    director !== normalizePlanFormValue(plan?.director) ||
    goal !== normalizePlanFormValue(plan?.goal) ||
    status !== (plan?.status || "active") ||
    exercicio !== (plan?.exercicio ? String(plan.exercicio) : "") ||
    budgetLimit !== (typeof plan?.budget_limit === "number" ? String(plan.budget_limit) : "") ||
    visibility !== (plan?.visibility || "public");
  const showServerError = attemptedSubmit && state.message && !state.success;
  const unitOptions = catalogUnits.map((item) => item.name).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const matchedUnit =
    catalogUnits.find((item) => item.name.toLowerCase() === unit.trim().toLowerCase()) ||
    catalogUnits.find((item) => item.id === plan?.unit_id) ||
    null;
  const matchedArea = matchedUnit ? catalogAreas.find((item) => item.id === matchedUnit.area_id) || null : null;
  const resolvedTitle = resolvePlanTitle(title, unit);
  const effectivePlanName = resolvedTitle.trim();
  const progressTone =
    formProgress === 100
      ? "text-emerald-600 dark:text-emerald-400"
      : formProgress >= 50
      ? "text-blue-600 dark:text-blue-400"
      : "text-zinc-500 dark:text-zinc-400";
  const progressCopy = validation.canSubmit
    ? plan
      ? "Cabeçalho pronto para atualização."
      : "Cabeçalho pronto para criar o plano."
    : "Preencha a unidade para liberar a criação.";
  const submitLabel = plan ? "Salvar alterações" : "Criar plano";
  const submitHelper = plan
    ? hasChanges
      ? "As alterações serão aplicadas ao cabeçalho deste plano."
      : "Edite pelo menos um campo para salvar."
    : "O plano será criado e ficará pronto para receber ações.";

  const handleUnitChange = (value: string) => {
    const sanitizedValue = sanitize(value);
    const previousAutoTitle = resolvePlanTitle(titleTouched ? "" : title, unit);
    setUnit(sanitizedValue);
    if (!titleTouched || title.trim() === previousAutoTitle) {
      setTitle(sanitizedValue);
      setTitleTouched(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full border-zinc-300 bg-white/80 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300"
          >
            {plan ? "Editar cabeçalho" : "Novo plano"}
          </Badge>
          <div>
            <h3 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              {plan ? "Atualizar plano" : "Criar plano de ação"}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {plan
                ? "Revise os dados principais antes de continuar com as ações do plano."
                : "Preencha primeiro o essencial. Os campos complementares podem ser refinados depois."}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-5 rounded-2xl border border-zinc-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,244,245,0.88))] p-4 shadow-sm dark:border-zinc-700 dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.92),rgba(39,39,42,0.88))]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Resumo do cabeçalho</p>
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                {effectivePlanName || "Plano sem nome definido"}
              </h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {matchedArea
                  ? `Área vinculada: ${matchedArea.name}`
                  : "Defina a unidade oficial para vincular a área automaticamente."}
              </p>
            </div>
          </div>
          <div className="min-w-[172px] rounded-xl border border-white/70 bg-white/80 p-3 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/60">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400">Progresso</span>
              <span className="text-[10px] font-mono text-zinc-400">
                {fieldsFilled}/{totalFields}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  formProgress === 100 ? "bg-emerald-500" : formProgress >= 50 ? "bg-blue-500" : "bg-zinc-300",
                )}
                style={{ width: `${Math.max(formProgress, 4)}%` }}
              />
            </div>
            <p className={cn("mt-2 text-xs font-medium", progressTone)}>{progressCopy}</p>
          </div>
        </div>
      </div>

      {!plan && templates.length > 0 && (
        <div className="mb-5 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-800/40">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Atalho com template
              </label>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Use um modelo pronto quando quiser criar o plano e a estrutura inicial em um único passo.
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              Opcional
            </Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={templateLoading}
                onClick={() => applyTemplate(t.id)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-3 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-wait disabled:opacity-70 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t.name}</span>
                <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  {templateLoading ? "Criando plano..." : "Cria o plano com a estrutura padrão do template."}
                </span>
              </button>
            ))}
          </div>
          {templateError && <p className="mt-2 text-[11px] text-red-500">{templateError}</p>}
        </div>
      )}

      <form action={action} onSubmit={() => setAttemptedSubmit(true)} className="space-y-5">
        {plan && <input type="hidden" name="planId" value={plan.id} />}
        <input type="hidden" name="tenantId" value={tenantId} />
        <input type="hidden" name="title" value={resolvedTitle} />
        <input type="hidden" name="unit_id" value={matchedUnit?.id || ""} />

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="plan-status" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Situação do plano</Label>
            <Select id="plan-status" name="status" value={status} onChange={(e) => setStatus(e.target.value as "active" | "archived")} className="rounded-lg h-9">
              <option value="active">Ativo</option>
              <option value="archived">Arquivado</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-exercicio" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Ano / Exercício</Label>
            <Input id="plan-exercicio" name="exercicio" type="number" min="2000" max="2100" value={exercicio} onChange={(e) => setExercicio(e.target.value)} className="rounded-lg h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-budget" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Teto Orçamentário (R$)</Label>
            <Input id="plan-budget" name="budget_limit" type="number" step="0.01" min="0" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} className="rounded-lg h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-visibility" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Visibilidade</Label>
            <Select id="plan-visibility" name="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value as "public" | "restricted")} className="rounded-lg h-9">
              <option value="public">Público</option>
              <option value="restricted">Restrito</option>
            </Select>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-800/40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Modelo oficial</p>
              <h4 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {buildOfficialPlanHeader(unit)}
              </h4>
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              Aba PLANO DE AÇÃO
            </Badge>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            O cabeçalho do modelo oficial é orientado por unidade. O nome interno do plano segue a unidade por padrão,
            mas pode ser personalizado abaixo.
          </p>
        </div>

        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Informações principais</h4>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Preencha a unidade primeiro. Ela define o título padrão e ajuda a manter aderência ao modelo oficial.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="plan-unit" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Nome da unidade<span className="text-red-500 ml-0.5">*</span>
              </Label>
              {matchedUnit?.uf && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                  {matchedUnit.uf}
                </span>
              )}
            </div>
            <Select
              id="plan-unit"
              name="unit"
              value={unit}
              autoFocus
              onChange={(e) => handleUnitChange(e.target.value)}
              aria-invalid={Boolean(validation.unitError)}
              aria-describedby="plan-unit-help"
              className={cn(
                "transition-all rounded-lg",
                validation.unitError ? "border-red-300 focus-visible:ring-red-500" : "focus:shadow-md",
              )}
            >
              <option value="">Selecione uma unidade disponível</option>
              {unitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <div id="plan-unit-help">
              {validation.unitError ? (
                <p className="text-[11px] text-red-500 animate-[slideDown_150ms_ease-out]">{validation.unitError}</p>
              ) : matchedArea ? (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  Unidade reconhecida. Área oficial vinculada: {matchedArea.name}
                </p>
              ) : (
                <p className="text-[11px] text-zinc-400">Use o nome da unidade conforme a aba de apoio do modelo.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Nome salvo no sistema
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {effectivePlanName || "Aguardando definição da unidade"}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {title.trim() ? "Personalizado" : "Automático"}
              </Badge>
            </div>
          </div>

          <FieldV
            label="Nome do plano no sistema"
            id="plan-title-preview"
            name="title_preview"
            value={title}
            onChange={(value) => {
              setTitle(value);
              setTitleTouched(true);
            }}
            placeholder="Se vazio, o sistema usa o nome da unidade"
            max={200}
            valid={validation.titleValid}
            error={validation.titleError}
            hint="Opcional. Se não personalizar, o plano assume automaticamente o nome da unidade."
          />
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Contexto executivo</h4>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Esses campos melhoram leitura, busca e acompanhamento, mas não travam a criação do plano.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldV
              label="Diretor(a) / responsável executivo"
              id="plan-director"
              name="director"
              value={director}
              onChange={setDirector}
              placeholder="Nome do responsável"
              max={200}
              valid={validation.directorValid}
              hint="Metadado complementar do sistema."
            />
            <FieldV
              label="Objetivo / meta do plano"
              id="plan-goal"
              name="goal"
              value={goal}
              onChange={setGoal}
              placeholder="Ex: 7.908 INSC | 1.382 MF | 1.214 ACAD"
              max={1000}
              valid={validation.goalValid}
              hint="Metadado complementar para acompanhamento executivo."
            />
          </div>
        </section>

        {showServerError && <Msg message={state.message!} />}

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/85 p-4 dark:border-zinc-700 dark:bg-zinc-800/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{submitLabel}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{submitHelper}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={isPending}
                disabled={!validation.canSubmit || (plan ? !hasChanges : false)}
              >
                <Save className="h-4 w-4 mr-1" />
                {submitLabel}
              </Button>
            </div>
          </div>
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

function FieldV({
  label,
  id,
  name,
  value,
  onChange,
  multiline,
  required,
  placeholder,
  type,
  max,
  valid,
  error,
  hint,
}: {
  label: string;
  id?: string;
  name: string;
  value?: string;
  onChange?: (v: string) => void;
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
  type?: string;
  max?: number;
  valid?: boolean;
  error?: string;
  hint?: string;
}) {
  const length = value?.length || 0;
  const showError = error && error.length > 0;
  const showWarning = max && length > max - 20 && !showError;
  const charsLeft = max ? max - length : 0;
  const fieldId = id ?? name;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = showError ? `${fieldId}-error` : undefined;
  const describedBy = showError ? errorId : hintId;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={fieldId} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        {max && (
          <span
            className={cn(
              "font-mono text-[10px] transition-colors",
              charsLeft < 0 ? "text-red-500 font-semibold" : showWarning ? "text-amber-500" : "text-zinc-400",
            )}
          >
            {charsLeft}
          </span>
        )}
      </div>
      {multiline ? (
        <textarea
          id={fieldId}
          name={name}
          value={value}
          placeholder={placeholder}
          required={required}
          rows={2}
          aria-invalid={showError || undefined}
          aria-describedby={describedBy}
          onChange={(e) => {
            const v = sanitize(e.target.value);
            onChange?.(v);
          }}
          className={cn(
            "flex w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 resize-none transition-all",
            showError
              ? "border-red-300 focus-visible:ring-red-500"
              : valid === false
              ? "border-amber-300 focus-visible:ring-amber-500"
              : "border-zinc-200 focus-visible:ring-zinc-500 dark:border-zinc-700",
          )}
        />
      ) : (
        <Input
          id={fieldId}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          required={required}
          aria-invalid={showError || undefined}
          aria-describedby={describedBy}
          onChange={(e) => {
            const v = type !== "date" && type !== "number" ? sanitize(e.target.value) : e.target.value;
            onChange?.(v);
          }}
          className={cn(
            "transition-all rounded-lg",
            showError ? "border-red-300 focus-visible:ring-red-500" : valid === false ? "border-amber-300 focus-visible:ring-amber-500" : "focus:shadow-md",
          )}
        />
      )}
      {showError && <p id={errorId} className="text-[11px] text-red-500 animate-[slideDown_150ms_ease-out]">{error}</p>}
      {!showError && hint && <p id={hintId} className="text-[11px] text-zinc-400">{hint}</p>}
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
