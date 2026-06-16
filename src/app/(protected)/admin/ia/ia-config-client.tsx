"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  Sparkles, Check, X, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, CircleSlash, KeyRound, Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { saveLlmSettings, getLlmSettings, testLlmConnection } from "@/app/actions/llm-settings";
import { PROVIDERS, PROVIDER_MODELS, type ProviderKey } from "@/lib/llm-client";
import type { LlmSettingsPublic, LlmFormState } from "@/app/actions/llm-settings";
import type { Tenant } from "@/types/tenant";

const PROVIDER_KEYS = Object.keys(PROVIDERS) as ProviderKey[];
const CUSTOM_MODEL_SENTINEL = "__custom__";

const initialState: LlmFormState = {};

export function IaConfigClient({
  tenants,
  initialTenantId,
  initialSettings,
}: {
  tenants: Tenant[];
  initialTenantId: string | null;
  initialSettings: LlmSettingsPublic | null;
}) {
  const [state, action, isPending] = useActionState(saveLlmSettings, initialState);
  const [isPendingTest, startTest] = useTransition();

  const [selectedTenantId, setSelectedTenantId] = useState(initialTenantId ?? "");
  const [settings, setSettings] = useState<LlmSettingsPublic | null>(initialSettings);
  const [loadingSettings, setLoadingSettings] = useState(false);

  const [provider, setProvider] = useState<ProviderKey>(
    (initialSettings?.provider as ProviderKey) ?? "openrouter",
  );

  const suggestedModels = PROVIDER_MODELS[provider] ?? [];
  const initialModel = initialSettings?.model ?? suggestedModels[0] ?? "";
  const initialIsCustom = Boolean(initialModel && !suggestedModels.includes(initialModel));
  const [modelSelect, setModelSelect] = useState(initialIsCustom ? CUSTOM_MODEL_SENTINEL : initialModel);
  const [modelCustom, setModelCustom] = useState(initialIsCustom ? initialModel : "");
  const effectiveModel = modelSelect === CUSTOM_MODEL_SENTINEL ? modelCustom : modelSelect;

  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(initialSettings?.base_url ?? "");
  const [showBaseUrl, setShowBaseUrl] = useState(Boolean(initialSettings?.base_url));
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const prevTenantId = useRef(initialTenantId);

  useEffect(() => {
    if (selectedTenantId === prevTenantId.current) return;
    prevTenantId.current = selectedTenantId;

    if (!selectedTenantId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettings(null);
      return;
    }

    let cancelled = false;
    setLoadingSettings(true);
    setTestResult(null);
    setApiKey("");

    getLlmSettings(selectedTenantId).then((s) => {
      if (cancelled) return;
      setSettings(s);
      const newProvider = (s?.provider as ProviderKey) ?? "openrouter";
      setProvider(newProvider);
      const newSuggested = PROVIDER_MODELS[newProvider] ?? [];
      const newModel = s?.model ?? newSuggested[0] ?? "";
      const isCustom = Boolean(newModel && !newSuggested.includes(newModel));
      setModelSelect(isCustom ? CUSTOM_MODEL_SENTINEL : newModel);
      setModelCustom(isCustom ? newModel : "");
      setBaseUrl(s?.base_url ?? "");
      setShowBaseUrl(Boolean(s?.base_url));
      setLoadingSettings(false);
    });

    return () => { cancelled = true; };
  }, [selectedTenantId]);

  // Limpa key após save bem-sucedido
  useEffect(() => {
    if (!state.success) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiKey("");
  }, [state.success]);

  function handleProviderChange(p: ProviderKey) {
    setProvider(p);
    const models = PROVIDER_MODELS[p] ?? [];
    setModelSelect(models[0] ?? "");
    setModelCustom("");
    setBaseUrl("");
    setTestResult(null);
  }

  function handleTest() {
    setTestResult(null);
    startTest(async () => {
      const result = await testLlmConnection(provider, effectiveModel, apiKey, baseUrl || undefined);
      setTestResult(result);
    });
  }

  if (tenants.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader />
        <p className="text-sm text-zinc-500">Nenhuma empresa cadastrada. Crie empresas antes de configurar a IA.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      <div className="flex gap-6">
        {/* Tenant list */}
        <div className="w-52 shrink-0 space-y-1">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Empresas
          </p>
          {tenants.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTenantId(t.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                t.id === selectedTenantId
                  ? "bg-accent-50 text-accent-700 dark:bg-accent-950/30 dark:text-accent-300"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
              }`}
            >
              <span className="min-w-0 flex-1 truncate font-medium">{t.name}</span>
            </button>
          ))}
        </div>

        {/* Config form */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {tenants.find((t) => t.id === selectedTenantId)?.name}
            </h3>
            {loadingSettings && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
            {!loadingSettings && settings?.hasApiKey && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> IA configurada
              </span>
            )}
            {!loadingSettings && !settings?.hasApiKey && selectedTenantId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                <CircleSlash className="h-3 w-3" /> Sem configuração
              </span>
            )}
          </div>

          <Card className="max-w-lg">
            <CardContent className="pt-5">
              <form action={action} className="space-y-5">
                <input type="hidden" name="tenant_id" value={selectedTenantId} />
                <input type="hidden" name="model" value={effectiveModel} />

                {/* Modelo */}
                <section className="space-y-4">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    <Cpu className="h-3 w-3" /> Modelo
                  </p>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Provedor</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {PROVIDER_KEYS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleProviderChange(p)}
                          className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                            provider === p
                              ? "border-accent-500 bg-accent-50 text-accent-700 dark:border-accent-400 dark:bg-accent-950/30 dark:text-accent-300"
                              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400"
                          }`}
                        >
                          {PROVIDERS[p].label}
                        </button>
                      ))}
                    </div>
                    <input type="hidden" name="provider" value={provider} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="model-select" className="text-xs">Modelo</Label>
                    <select
                      id="model-select"
                      value={modelSelect}
                      onChange={(e) => setModelSelect(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                    >
                      {suggestedModels.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                      <option value={CUSTOM_MODEL_SENTINEL}>Outro (personalizado)...</option>
                    </select>
                    {modelSelect === CUSTOM_MODEL_SENTINEL && (
                      <Input
                        value={modelCustom}
                        onChange={(e) => setModelCustom(e.target.value)}
                        placeholder={`Ex: ${suggestedModels[0] ?? "model-id"}`}
                        className="font-mono text-sm"
                        autoFocus
                      />
                    )}
                  </div>
                </section>

                <div className="border-t border-zinc-100 dark:border-zinc-800" />

                {/* Autenticação */}
                <section className="space-y-4">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    <KeyRound className="h-3 w-3" /> Autenticação
                  </p>

                  <div className="space-y-1.5">
                    <Label htmlFor="api_key" className="text-xs">
                      API Key
                      {settings?.hasApiKey && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          configurada
                        </span>
                      )}
                    </Label>
                    <Input
                      id="api_key"
                      name="api_key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={settings?.hasApiKey ? "Deixe em branco para manter a atual" : "sk-..."}
                      autoComplete="off"
                    />
                    <p className="text-[11px] text-zinc-400">
                      Armazenada de forma segura — nunca exibida novamente.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setShowBaseUrl((v) => !v)}
                      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      {showBaseUrl ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      URL base personalizada
                    </button>
                    {showBaseUrl ? (
                      <Input
                        name="base_url"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder={PROVIDERS[provider].baseUrl}
                        className="font-mono text-xs"
                      />
                    ) : (
                      <input type="hidden" name="base_url" value="" />
                    )}
                  </div>
                </section>

                {state.message && (
                  <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    state.success
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                  }`}>
                    {state.success ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
                    {state.message}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Button type="submit" isLoading={isPending} disabled={!selectedTenantId || !effectiveModel}>
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTest}
                    disabled={isPendingTest || (!apiKey && !settings?.hasApiKey)}
                  >
                    {isPendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Testar conexão
                  </Button>
                </div>

                {testResult && (
                  <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                    testResult.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
                  }`}>
                    {testResult.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <X className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbPage>Administração</BreadcrumbPage></BreadcrumbItem>
          <BreadcrumbItem><BreadcrumbPage>IA / Modelos</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-accent-600" /> IA / Modelos
        </h2>
        <p className="text-sm text-zinc-500">
          Configuração por empresa — cada tenant tem provedor, modelo e chave isolados.
        </p>
      </div>
    </>
  );
}
