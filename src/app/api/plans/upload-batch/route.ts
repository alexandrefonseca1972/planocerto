import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkPermission } from "@/app/actions/admin";
import { PERMISSIONS } from "@/lib/permissions";
import { sanitizeText } from "@/app/actions/_catalog-utils";
import {
  FAROL_MAP, COL, REQUIRED_HEADERS,
  parseStatus, parseDate, parseNum, trimStr,
  detectHeaderRow, normHeader,
} from "@/lib/planos-import";

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
    const ACCEPTED_EXTS = new Set([".xlsx", ".xlsb", ".xls"]);
    const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

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
        const headerRow = detectHeaderRow(rows);

        // Valida headers críticos
        const header = rows[headerRow] as string[];
        const headerErrors: string[] = [];
        for (const [idx, expected] of Object.entries(REQUIRED_HEADERS)) {
          const actual = trimStr(header[Number(idx)]);
          if (!actual || normHeader(actual) !== normHeader(expected)) {
            headerErrors.push(`Col ${String.fromCharCode(65 + Number(idx))}: esperada "${expected}", encontrada "${actual || "(vazia)"}"`);
          }
        }
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
        const finalUnit  = (await sanitizeText(rawUnit || firstUnit)).slice(0, 200);

        // Cria o plano
        const { data: plan, error: planErr } = await supabase
          .from("action_plans")
          .insert({ tenant_id: tenantId, user_id: user.id, title: finalTitle, unit: finalUnit, director: "", goal: "" })
          .select("id")
          .single();

        if (planErr || !plan) {
          results.push({ filename, planTitle: finalTitle, planUnit: finalUnit, created: 0, skipped: 0, errors: [], status: "error", errorMessage: "Erro ao criar plano." });
          continue;
        }

        const planId = plan.id;

        // ── Processa linhas e monta batches ─────────────────────────────────
        // Primeiro passa: coleta grupos únicos e itens
        const groupNames: string[] = [];
        const seenGroups = new Set<string>();
        const itemRows: { row: unknown[]; macroAcao: string }[] = [];

        for (const rawRow of dataRows) {
          const row = rawRow as unknown[];
          const acao = trimStr(row[COL.ACAO]);
          if (!acao) continue;
          const macroAcao = trimStr(row[COL.MACRO]);
          if (macroAcao && !seenGroups.has(macroAcao)) {
            seenGroups.add(macroAcao);
            groupNames.push(macroAcao);
          }
          itemRows.push({ row, macroAcao });
        }

        // Segunda passa: insere grupos em batch
        const groupMap = new Map<string, string>(); // macroAcao → id
        if (groupNames.length > 0) {
          const groupInserts = await Promise.all(
            groupNames.map(async (name, i) => ({
              plan_id: planId,
              number: String(i + 1),
              sort_order: i + 1,
              action: (await sanitizeText(name)).slice(0, 500),
              tipo_pa: "",
              area: "",
              prioridade: "",
              status: 1 as const,
            }))
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: grupos, error: grupoErr } = await supabase.from("action_items").insert(groupInserts as any).select("id, action");
          if (grupoErr || !grupos) {
            results.push({ filename, planTitle: finalTitle, planUnit: finalUnit, created: 0, skipped: 0, errors: [`Erro ao criar grupos: ${grupoErr?.message}`], status: "error", errorMessage: "Falha ao criar grupos de ação." });
            // Limpa o plano criado para não ficar orfão
            await supabase.from("action_plans").delete().eq("id", planId);
            continue;
          }
          for (const g of grupos) {
            groupMap.set(trimStr(g.action), g.id as string);
          }
        }

        // Terceira passa: insere itens em batch (lotes de 50 para não exceder limites)
        const BATCH_SIZE = 50;
        const errors: string[] = [];
        let created = groupNames.length; // grupos já criados contam
        let skipped = 0;
        let sortBase = groupNames.length + 1;

        // Sanitiza campos de texto em paralelo antes de montar os inserts
        const sanitizedItems = await Promise.all(
          itemRows.map(async ({ row, macroAcao }) => {
            const [action, subacao, como, where, responsible, cost, tipo_pa, area, prioridade, observations] =
              await Promise.all([
                sanitizeText(trimStr(row[COL.ACAO])),
                sanitizeText(trimStr(row[COL.SUBACAO])),
                sanitizeText(trimStr(row[COL.COMO])),
                sanitizeText(trimStr(row[COL.ONDE])),
                sanitizeText(trimStr(row[COL.QUEM])),
                sanitizeText(trimStr(row[COL.QUANTO])),
                sanitizeText(trimStr(row[COL.TIPO_PA])),
                sanitizeText(trimStr(row[COL.AREA])),
                sanitizeText(trimStr(row[COL.PRIORIDADE])),
                sanitizeText(trimStr(row[COL.OBS])),
              ]);
            return { row, macroAcao, action, subacao, como, where, responsible, cost, tipo_pa, area, prioridade, observations };
          })
        );

        const itemInserts: object[] = [];
        for (const { row, macroAcao, action, subacao, como, where, responsible, cost, tipo_pa, area, prioridade, observations } of sanitizedItems) {
          const farolRaw = trimStr(row[COL.FAROL]);
          const parentId = macroAcao ? (groupMap.get(macroAcao) ?? null) : null;

          itemInserts.push({
            plan_id: planId,
            parent_id: parentId,
            number: parentId ? `${macroAcao}.${sortBase}` : String(sortBase),
            sort_order: sortBase++,
            action: action.slice(0, 500),
            subacao: subacao.slice(0, 500),
            como: como.slice(0, 500),
            where: where.slice(0, 500),
            responsible: responsible.slice(0, 200),
            cost: cost.slice(0, 100),
            tipo_pa: tipo_pa.slice(0, 100),
            area: area.slice(0, 100),
            prioridade: prioridade.slice(0, 100),
            planned_start: parseDate(row[COL.INICIO_PREV]),
            planned_end:   parseDate(row[COL.TERMINO_PREV]),
            actual_start:  parseDate(row[COL.INICIO_REAL]),
            actual_end:    parseDate(row[COL.TERMINO_REAL]),
            status: parseStatus(farolRaw),
            observations: observations.slice(0, 2000),
            inscritos_esperado: parseNum(row[COL.INSC_ESP]),
            inscritos_real:     parseNum(row[COL.INSC_REAL]),
            mat_fin_esperado:   parseNum(row[COL.MATFIN_ESP]),
            mat_fin_real:       parseNum(row[COL.MATFIN_REAL]),
            mat_acad_esperado:  parseNum(row[COL.MATACD_ESP]),
            mat_acad_real:      parseNum(row[COL.MATACD_REAL]),
          });
        }

        // Insere em lotes
        for (let i = 0; i < itemInserts.length; i += BATCH_SIZE) {
          const batch = itemInserts.slice(i, i + BATCH_SIZE);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: batchErr, count } = await supabase.from("action_items").insert(batch as any, { count: "exact" });
          if (batchErr) {
            errors.push(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batchErr.message}`);
            skipped += batch.length;
          } else {
            created += count ?? batch.length;
          }
        }

        // Revalida caches
        await supabase.from("action_plans").update({ updated_at: new Date().toISOString() }).eq("id", planId);

        results.push({
          filename, planId,
          planTitle: finalTitle, planUnit: finalUnit,
          created, skipped, errors,
          status: created > groupNames.length ? "success" : "error",
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
