"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { FAROL_MAP, COL, REQUIRED_HEADERS, normHeader, detectHeaderRow } from "@/lib/planos-import";
import {
  UploadCloud, FileSpreadsheet, X, CheckCircle2, AlertCircle,
  AlertTriangle, Loader2, ChevronRight, RotateCcw, FolderOpen, Download,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────

const MAX_FILES = 10;
const MAX_SIZE_MB = 20;
const ACCEPTED_EXTS = [".xlsx", ".xlsb", ".xls"];

type ValidationError = { row: number; col: string; message: string };

type FileValidation = {
  file: File;
  status: "pending" | "validating" | "valid" | "invalid";
  planTitle: string;
  planUnit: string;
  itemCount: number;
  groupCount: number;
  errors: ValidationError[];
  warnings: string[];
};

type UploadResult = {
  filename: string;
  planTitle: string;
  planUnit: string;
  planId?: string;
  created: number;
  skipped: number;
  errors: string[];
  status: "success" | "error";
  errorMessage?: string;
};

type Step = "select" | "validate" | "upload" | "done";

// ─── Validation helpers ───────────────────────────────────────────────────

function strTrim(raw: unknown): string { return raw == null ? "" : String(raw).trim(); }

async function validateFile(file: File): Promise<Omit<FileValidation, "file" | "status">> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });

  const sheetName = wb.SheetNames.find((n) =>
    n.trim().toUpperCase().includes("PLANO DE AÇÃO") ||
    n.trim().toUpperCase().includes("PLANO DE ACAO"),
  ) ?? wb.SheetNames[0];

  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  if (!sheetName) {
    return { planTitle: "", planUnit: "", itemCount: 0, groupCount: 0, errors: [{ row: 0, col: "—", message: "Nenhuma aba encontrada no arquivo." }], warnings };
  }

  const ws = wb.Sheets[sheetName];
  if (!ws) {
    return { planTitle: "", planUnit: "", itemCount: 0, groupCount: 0, errors: [{ row: 0, col: "—", message: `Aba "${sheetName}" não encontrada.` }], warnings };
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (rows.length < 3) {
    return { planTitle: "", planUnit: "", itemCount: 0, groupCount: 0, errors: [{ row: 0, col: "—", message: "Arquivo sem linhas suficientes (mínimo: 3)." }], warnings };
  }

  // Detecta header usando helper compartilhado
  const headerRow = detectHeaderRow(rows);

  // Valida headers críticos usando mapa compartilhado
  const header = rows[headerRow] as string[];
  for (const [idx, expected] of Object.entries(REQUIRED_HEADERS)) {
    const actual = strTrim(header[Number(idx)]);
    if (!actual || normHeader(actual) !== normHeader(expected)) {
      errors.push({
        row: headerRow + 1,
        col: String.fromCharCode(65 + Number(idx)),
        message: `Coluna ${String.fromCharCode(65 + Number(idx))} esperada: "${expected}", encontrada: "${actual || "(vazia)"}"`,
      });
    }
  }

  if (errors.length > 0) {
    return { planTitle: "", planUnit: "", itemCount: 0, groupCount: 0, errors, warnings };
  }

  // Extrai título/unidade da linha de cabeçalho do plano
  const titleRow = rows[0] as string[];
  const planTitle = strTrim(titleRow?.[0]).replace(/PLANO DE AÇÃO\s*\|?\s*/i, "").trim() || file.name.replace(/\.[^.]+$/, "");
  const planUnit  = strTrim(titleRow?.[1]) || "";

  const dataRows = rows.slice(headerRow + 1);
  const groups = new Set<string>();
  let itemCount = 0;

  dataRows.forEach((rawRow, idx) => {
    const row = rawRow as unknown[];
    const acao     = strTrim(row[COL.ACAO]);
    const farolRaw = strTrim(row[COL.FAROL]);
    const rowNum   = headerRow + 2 + idx;

    if (!acao) return; // linha vazia — ok
    itemCount++;

    const macroAcao = strTrim(row[COL.MACRO]);
    if (macroAcao) groups.add(macroAcao);

    // Valida FAROL
    if (farolRaw && !FAROL_MAP[farolRaw.toUpperCase()]) {
      warnings.push(`Linha ${rowNum}: FAROL "${farolRaw}" desconhecido — será tratado como "Não Iniciada".`);
    }

    // Valida datas
    const dateFields = [
      { colIdx: COL.INICIO_PREV,  name: "INÍCIO PREVISTO" },
      { colIdx: COL.TERMINO_PREV, name: "TÉRMINO PREVISTO" },
      { colIdx: COL.INICIO_REAL,  name: "INÍCIO REAL" },
      { colIdx: COL.TERMINO_REAL, name: "TÉRMINO REAL" },
    ];
    for (const { colIdx, name } of dateFields) {
      const val = row[colIdx];
      if (!val) continue;
      if (typeof val === "number") continue; // serial do Excel — OK
      const s = String(val).trim();
      if (s && !/^\d{2}\/\d{2}\/\d{4}$/.test(s) && !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        errors.push({ row: rowNum, col: name, message: `Data inválida "${s}" (use DD/MM/AAAA).` });
      }
    }

    // AÇÃO mínima de 2 chars
    if (acao.length < 2) {
      errors.push({ row: rowNum, col: "AÇÃO", message: `Ação muito curta: "${acao}"` });
    }
  });

  if (itemCount === 0) {
    errors.push({ row: 0, col: "—", message: "Nenhuma linha de ação encontrada no arquivo." });
  }

  return { planTitle, planUnit, itemCount, groupCount: groups.size, errors, warnings };
}

// ─── Component ────────────────────────────────────────────────────────────

export function UploadPlanosDialog({
  onClose,
  onSuccess,
  planId,
  planTitle,
}: {
  onClose: () => void;
  onSuccess: () => void;
  /** Se fornecido, importa os itens do arquivo para este plano em vez de criar novos planos. */
  planId?: string;
  planTitle?: string;
}) {
  const isImportMode = Boolean(planId);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("select");
  const [files, setFiles] = useState<FileValidation[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // ── File selection ───────────────────────────────────────────────────────

  function addFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming);
    const valid = arr.filter((f) => {
      const ext = f.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
      if (!ACCEPTED_EXTS.includes(ext)) {
        toast(`"${f.name}" não é um arquivo Excel suportado.`, "error");
        return false;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast(`"${f.name}" excede ${MAX_SIZE_MB}MB.`, "error");
        return false;
      }
      return true;
    });

    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.file.name));
      const novos = valid.filter((f) => !existing.has(f.name)).slice(0, MAX_FILES - prev.length);
      if (prev.length + novos.length > MAX_FILES) {
        toast(`Máximo de ${MAX_FILES} arquivos por upload.`, "error");
      }
      return [
        ...prev,
        ...novos.map((f): FileValidation => ({ file: f, status: "pending", planTitle: "", planUnit: "", itemCount: 0, groupCount: 0, errors: [], warnings: [] })),
      ];
    });
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Validation ───────────────────────────────────────────────────────────

  async function runValidation() {
    setStep("validate");
    const updated = [...files];
    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: "validating" };
      setFiles([...updated]);
      try {
        const result = await validateFile(updated[i].file);
        updated[i] = { ...updated[i], ...result, status: result.errors.length > 0 ? "invalid" : "valid" };
      } catch {
        updated[i] = { ...updated[i], status: "invalid", errors: [{ row: 0, col: "—", message: "Erro ao ler o arquivo." }] };
      }
      setFiles([...updated]);
    }
  }

  // ── Upload ───────────────────────────────────────────────────────────────

  async function runUpload() {
    const validFiles = files.filter((f) => f.status === "valid");
    if (!validFiles.length) return;

    setStep("upload");

    try {
      if (isImportMode && planId) {
        // Importa itens no plano atual — usa a rota existente (arquivo único)
        const results: UploadResult[] = [];
        for (const fv of validFiles) {
          const fd = new FormData();
          fd.append("file", fv.file);
          const res = await fetch(`/api/plans/${planId}/import`, { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) {
            results.push({ filename: fv.file.name, planTitle: planTitle ?? "", planUnit: "", created: 0, skipped: 0, errors: [data.error ?? "Erro ao importar"], status: "error", errorMessage: data.error });
          } else {
            results.push({ filename: fv.file.name, planTitle: planTitle ?? "", planUnit: "", created: data.created ?? 0, skipped: data.skipped ?? 0, errors: data.errors ?? [], status: "success" });
          }
        }
        setUploadResults(results);
      } else {
        // Cria novos planos — usa o batch
        const fd = new FormData();
        for (const fv of validFiles) fd.append("files", fv.file);
        const res = await fetch("/api/plans/upload-batch", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          toast(data.error ?? "Erro no upload.", "error");
          setStep("validate");
          return;
        }
        setUploadResults(data.results ?? []);
      }
      setStep("done");
    } catch {
      toast("Erro de conexão ao enviar os arquivos.", "error");
      setStep("validate");
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────

  const validCount   = files.filter((f) => f.status === "valid").length;
  const invalidCount = files.filter((f) => f.status === "invalid").length;
  const pendingCount = files.filter((f) => f.status === "pending").length;
  const allValidated = files.length > 0 && pendingCount === 0 && files.every((f) => f.status !== "validating");
  const successResults = uploadResults.filter((r) => r.status === "success");
  const errorResults   = uploadResults.filter((r) => r.status === "error");

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget && step !== "upload") onClose(); }}>
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold">
              {isImportMode ? "Importar ações do Excel" : "Importar planos do Excel"}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {step === "select"   && (isImportMode
                ? `Selecione até ${MAX_FILES} arquivos para importar ações para "${planTitle ?? "este plano"}".`
                : `Selecione até ${MAX_FILES} arquivos Excel — cada arquivo cria um novo plano.`)}
              {step === "validate" && "Validando estrutura e dados dos arquivos..."}
              {step === "upload"   && (isImportMode ? "Importando ações..." : "Criando planos...")}
              {step === "done"     && `${successResults.length} arquivo${successResults.length !== 1 ? "s" : ""} importado${successResults.length !== 1 ? "s" : ""} com sucesso.`}
            </p>
          </div>
          {step !== "upload" && (
            <button onClick={onClose} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Steps indicator */}
        <div className="shrink-0 border-b border-zinc-100 px-6 py-2 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs">
            {(["select", "validate", "upload", "done"] as Step[]).map((s, i) => {
              const labels = ["Selecionar", "Validar", "Importar", "Concluído"];
              const stepIndex = ["select", "validate", "upload", "done"].indexOf(step);
              const isActive  = s === step;
              const isDone    = ["select", "validate", "upload", "done"].indexOf(s) < stepIndex;
              return (
                <div key={s} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-zinc-300" />}
                  <span className={cn("font-medium",
                    isActive ? "text-accent-600 dark:text-accent-400" :
                    isDone   ? "text-zinc-400" : "text-zinc-300")}>
                    {isDone && <CheckCircle2 className="inline mr-1 h-3 w-3 text-emerald-500" />}
                    {labels[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* ── STEP: SELECT ── */}
          {(step === "select" || (step === "validate" && files.some((f) => f.status === "pending"))) && (
            <>
              {/* Drop zone */}
              {files.length < MAX_FILES && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                    dragOver
                      ? "border-accent-400 bg-accent-50 dark:border-accent-600 dark:bg-accent-950/20"
                      : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/30",
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".xlsx,.xlsb,.xls"
                    className="sr-only"
                    onChange={(e) => { if (e.target.files) { addFiles(e.target.files); e.target.value = ""; } }}
                  />
                  <UploadCloud className={cn("h-10 w-10 transition-colors", dragOver ? "text-accent-500" : "text-zinc-300 dark:text-zinc-600")} />
                  <div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Arraste arquivos ou clique para selecionar</p>
                    <p className="mt-0.5 text-xs text-zinc-400">Excel (.xlsx, .xlsb, .xls) · Até {MAX_FILES} arquivos · Máx. {MAX_SIZE_MB}MB cada</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    <FolderOpen className="h-4 w-4 mr-1.5" /> Selecionar arquivos
                  </Button>
                </div>
              )}

              {/* Counter */}
              {files.length > 0 && (
                <p className="text-xs text-zinc-400">
                  {files.length}/{MAX_FILES} arquivo{files.length !== 1 ? "s" : ""} selecionado{files.length !== 1 ? "s" : ""}
                  {files.length < MAX_FILES && <span className="ml-1">· <button className="text-accent-600 hover:underline" onClick={() => fileInputRef.current?.click()}>adicionar mais</button></span>}
                </p>
              )}
            </>
          )}

          {/* ── FILE LIST ── */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((fv, i) => (
                <FileRow key={fv.file.name + i} fv={fv} onRemove={() => removeFile(i)} removable={step !== "upload"} />
              ))}
            </div>
          )}

          {/* ── STEP: DONE ── */}
          {step === "done" && (
            <div className="space-y-3">
              {successResults.map((r) => (
                <div key={r.filename} className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 truncate">{r.planTitle || r.filename}</p>
                    {r.planUnit && <p className="text-xs text-emerald-600 dark:text-emerald-500">{r.planUnit}</p>}
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                      {r.created} ação{r.created !== 1 ? "ões" : ""} criada{r.created !== 1 ? "s" : ""}
                      {r.skipped > 0 && ` · ${r.skipped} ignorada${r.skipped !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
              ))}
              {errorResults.map((r) => (
                <div key={r.filename} className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300 truncate">{r.filename}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{r.errorMessage ?? "Erro ao importar."}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {files.length === 0 && step === "select" && (
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
              <p className="text-xs font-medium text-zinc-500 mb-2">Formato esperado — aba &quot;PLANO DE AÇÃO&quot;:</p>
              <div className="flex flex-wrap gap-1.5">
                {["TIPO PA","ÁREA","UNIDADE","PRIORIDADE","MACRO AÇÃO","AÇÃO","SUBAÇÃO","COMO?","ONDE?","QUEM?","QUANTO","INSCRITOS","MAT.FIN","MAT.ACAD","INÍCIO PREV","TÉRMINO PREV","INÍCIO REAL","TÉRMINO REAL","FAROL","OBSERVAÇÕES"].map((col) => (
                  <span key={col} className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">{col}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs text-zinc-400">
            {step === "validate" && allValidated && (
              <span>
                {validCount > 0 && <span className="text-emerald-600 dark:text-emerald-400">{validCount} válido{validCount !== 1 ? "s" : ""}</span>}
                {invalidCount > 0 && <span className={cn(validCount > 0 && "ml-2", "text-red-600 dark:text-red-400")}>{invalidCount} com erro{invalidCount !== 1 ? "s" : ""}</span>}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === "select" && (
              <>
                <a href="/modelo-plano-acao.xlsx" download className="mr-auto">
                  <Button variant="ghost" size="sm" type="button">
                    <Download className="mr-1 h-3.5 w-3.5" /> Baixar modelo
                  </Button>
                </a>
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={runValidation} disabled={files.length === 0}>
                  Validar arquivos <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </>
            )}
            {step === "validate" && (
              <>
                <Button variant="outline" onClick={() => setStep("select")} disabled={!allValidated}>
                  Voltar
                </Button>
                {!allValidated ? (
                  <Button disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validando...
                  </Button>
                ) : (
                  <Button onClick={runUpload} disabled={validCount === 0}>
                    Importar {validCount} plano{validCount !== 1 ? "s" : ""} <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </>
            )}
            {step === "upload" && (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando...
              </Button>
            )}
            {step === "done" && (
              <>
                {errorResults.length > 0 && (
                  <Button variant="outline" onClick={() => { setFiles([]); setUploadResults([]); setStep("select"); }}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Tentar novamente
                  </Button>
                )}
                <Button onClick={() => { onSuccess(); onClose(); }}>
                  Concluir
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FileRow sub-component ────────────────────────────────────────────────

function FileRow({ fv, onRemove, removable }: { fv: FileValidation; onRemove: () => void; removable: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasIssues = fv.errors.length > 0 || fv.warnings.length > 0;

  return (
    <div className={cn(
      "rounded-lg border transition-colors",
      fv.status === "valid"      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/10" :
      fv.status === "invalid"    ? "border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/10" :
      fv.status === "validating" ? "border-blue-200 bg-blue-50/30 dark:border-blue-900/40 dark:bg-blue-950/10 animate-pulse" :
                                   "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900",
    )}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Icon */}
        <div className="shrink-0">
          {fv.status === "validating" && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
          {fv.status === "valid"      && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {fv.status === "invalid"    && <AlertCircle className="h-4 w-4 text-red-500" />}
          {fv.status === "pending"    && <FileSpreadsheet className="h-4 w-4 text-zinc-400" />}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">{fv.file.name}</p>
            <span className="shrink-0 text-[10px] text-zinc-400">{(fv.file.size / 1024).toFixed(0)}KB</span>
          </div>
          {fv.status === "valid" && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              {fv.planTitle && <span className="font-medium">{fv.planTitle}</span>}
              {fv.planUnit && <span className="text-emerald-600"> · {fv.planUnit}</span>}
              <span className="ml-1 text-emerald-600 dark:text-emerald-500">· {fv.itemCount} ações · {fv.groupCount} grupos</span>
            </p>
          )}
          {fv.status === "invalid" && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {fv.errors.length} erro{fv.errors.length !== 1 ? "s" : ""}
              {fv.warnings.length > 0 && ` · ${fv.warnings.length} aviso${fv.warnings.length !== 1 ? "s" : ""}`}
            </p>
          )}
          {fv.status === "valid" && fv.warnings.length > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">{fv.warnings.length} aviso{fv.warnings.length !== 1 ? "s" : ""}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {hasIssues && fv.status !== "pending" && fv.status !== "validating" && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded p-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
            >
              {expanded ? "ocultar" : "detalhes"}
            </button>
          )}
          {removable && (
            <button type="button" onClick={onRemove} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded errors/warnings */}
      {expanded && hasIssues && (
        <div className="border-t border-zinc-100 px-3 pb-3 pt-2 dark:border-zinc-800 space-y-1">
          {fv.errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              {e.row > 0 && <span className="shrink-0 text-zinc-400">Linha {e.row}, {e.col}:</span>}
              <span>{e.message}</span>
            </div>
          ))}
          {fv.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
