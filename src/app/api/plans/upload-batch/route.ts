import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkPermission } from "@/app/actions/admin";
import { PERMISSIONS } from "@/lib/permissions";
import { sanitizeText } from "@/app/actions/_catalog-utils";
import { resolvePlanUnitReference } from "@/lib/action-plan-units";
import {
  COL, trimStr,
  ACCEPTED_EXTS, MAX_FILE_BYTES,
  validatePlanoHeaders,
} from "@/lib/planos-import";
import { importPlanItems } from "@/lib/planos-import-server";

// ─── POST handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Verificação de autenticação e permissão
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const canCreate = await checkPermission(PERMISSIONS.PLANS_CREATE);
    if (!canCreate) return NextResponse.json({ error: "Sem permissão para criar planos." }, { status: 403 });

    // Resolve tenant ativo
    const { data: profile } = await supabase
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();
    const tenantId = profile?.active_tenant_id;
    if (!tenantId) return NextResponse.json({ error: "Nenhuma empresa ativa." }, { status: 400 });

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    if (files.length > 10) return NextResponse.json({ error: "Máximo de 10 arquivos por upload." }, { status: 400 });

    const XLSX = await import("xlsx");

    const results: {
      filename: string;
      planId?: string;
      planTitle: string;
      planUnit: string;
      created: number;
      skipped: number;
      errors: string[];
      status: "success" | "error";
      errorMessage?: string;
    }[] = [];

    for (const file of files) {
      const filename = file.name;

      // Validação server-side: extensão e tamanho
      const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
      if (!ACCEPTED_EXTS.has(ext)) {
        results.push({ filename, planTitle: "", planUnit: "", created: 0, skipped: 0, errors: [], status: "error", errorMessage: "Tipo de arquivo não suportado. Use .xlsx, .xlsb ou .xls." });
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        results.push({ filename, planTitle: "", planUnit: "", created: 0, skipped: 0, errors: [], status: "error", errorMessage: "Arquivo excede o limite de 20 MB." });
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });

        // Localiza a aba correta
        const sheetName = wb.SheetNames.find((n) =>
          n.trim().toUpperCase().includes("PLANO DE AÇÃO") ||
          n.trim().toUpperCase().includes("PLANO DE ACAO"),
        ) ?? wb.SheetNames[0];

        const ws = wb.Sheets[sheetName];
        if (!ws) {
          results.push({ filename, planTitle: "", planUnit: "", created: 0, skipped: 0, errors: [], status: "error", errorMessage: "Aba 'PLANO DE AÇÃO' não encontrada." });
          continue;
        }

        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        const { headerRow, errors: headerErrors } = validatePlanoHeaders(rows);
        if (headerErrors.length > 0) {
          results.push({ filename, planTitle: "", planUnit: "", created: 0, skipped: 0, errors: headerErrors, status: "error", errorMessage: "Estrutura do arquivo não corresponde ao modelo." });
          continue;
        }

        // Extrai título e unidade do cabeçalho do plano (linha 0 do modelo)
        const titleRow = rows[0] as string[];
        const rawTitle = trimStr(titleRow?.[0]).replace(/PLANO DE AÇÃO\s*\|?\s*/i, "").trim();
        const rawUnit  = trimStr(titleRow?.[1]);

        const dataRows = rows.slice(headerRow + 1);

        // Verifica se há dados
        const rowsWithAcao = dataRows.filter((r) => trimStr((r as unknown[])[COL.ACAO]).length > 0);
        if (rowsWithAcao.length === 0) {
          results.push({ filename, planTitle: rawTitle || filename, planUnit: rawUnit, created: 0, skipped: 0, errors: ["Arquivo não contém linhas de ação preenchidas."], status: "error", errorMessage: "Nenhuma ação encontrada." });
          continue;
        }

        // Deriva título a partir da coluna UNIDADE se necessário
        const firstUnit = trimStr(rowsWithAcao[0]?.[COL.UNIDADE]);
        const finalTitle = (await sanitizeText(rawTitle.length >= 2 ? rawTitle : (firstUnit || filename.replace(/\.[^.]+$/, "")))).slice(0, 200) || "Plano importado";
        const requestedUnitName = (await sanitizeText(rawUnit || firstUnit)).slice(0, 200);
        const resolvedUnit = await resolvePlanUnitReference(supabase, {
          tenantId,
          unitName: requestedUnitName,
          requireMatch: false,
        });
        const finalUnit = resolvedUnit.unitName;

        // Cria o plano
        const { data: plan, error: planErr } = await supabase
          .from("action_plans")
          .insert({ tenant_id: tenantId, user_id: user.id, title: finalTitle, unit_id: resolvedUnit.unitId, unit: finalUnit, director: "", goal: "" })
          .select("id")
          .single();

        if (planErr || !plan) {
          results.push({ filename, planTitle: finalTitle, planUnit: finalUnit, created: 0, skipped: 0, errors: [], status: "error", errorMessage: "Erro ao criar plano." });
          continue;
        }

        const planId = plan.id;

        // Insere grupos + itens via helper compartilhado (mesma numeração e
        // vínculo pai↔filho do import single-plan).
        const { created, skipped, errors, groupCount } = await importPlanItems(
          supabase,
          planId,
          dataRows,
        );

        // Nada criado (falha nos grupos ou em todos os lotes) → remove o órfão.
        if (created === 0) {
          await supabase.from("action_plans").delete().eq("id", planId);
          results.push({
            filename, planTitle: finalTitle, planUnit: finalUnit,
            created: 0, skipped, errors,
            status: "error",
            errorMessage: errors[0] ?? "Nenhum item importado.",
          });
          continue;
        }

        // Revalida caches
        await supabase.from("action_plans").update({ updated_at: new Date().toISOString() }).eq("id", planId);

        results.push({
          filename, planId,
          planTitle: finalTitle, planUnit: finalUnit,
          created, skipped, errors,
          status: created > groupCount ? "success" : "error",
        });

      } catch (err) {
        console.error(`[upload-batch] Erro no arquivo "${filename}":`, err);
        results.push({ filename, planTitle: "", planUnit: "", created: 0, skipped: 0, errors: [], status: "error", errorMessage: "Erro inesperado ao processar o arquivo." });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[upload-batch] Erro geral:", err);
    return NextResponse.json({ error: "Erro interno ao processar os arquivos." }, { status: 500 });
  }
}
