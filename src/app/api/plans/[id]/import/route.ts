import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidUuid } from "@/lib/validations/uuid";
import { sanitizeText } from "@/app/actions/_catalog-utils";
import { COL, parseStatus, parseDate, parseNum, trimStr, detectHeaderRow } from "@/lib/planos-import";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: planId } = await params;
    if (!isValidUuid(planId)) {
      return NextResponse.json({ error: "ID do plano inválido." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    // Verifica acesso ao plano
    const { data: plan } = await supabase
      .from("action_plans")
      .select("id, tenant_id")
      .eq("id", planId)
      .single();
    if (!plan) return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });

    const sheetName = wb.SheetNames.find((n) =>
      n.trim().toUpperCase().includes("PLANO DE AÇÃO") ||
      n.trim().toUpperCase().includes("PLANO DE ACAO"),
    ) ?? wb.SheetNames[0];

    const ws = wb.Sheets[sheetName];
    if (!ws) return NextResponse.json({ error: "Aba 'PLANO DE AÇÃO' não encontrada." }, { status: 422 });

    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    const headerRow = detectHeaderRow(rows);
    const dataRows = rows.slice(headerRow + 1);

    const groupMap = new Map<string, string>(); // macroAcao → item_id
    let sortOrder = 0;
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const rawRow of dataRows) {
      const row = rawRow as unknown[];
      const acao = trimStr(row[COL.ACAO]);
      const farolRaw = trimStr(row[COL.FAROL]);

      if (!acao) { skipped++; continue; }

      const macroAcao = trimStr(row[COL.MACRO]);
      const tipoPa    = await sanitizeText(trimStr(row[COL.TIPO_PA]));
      const area      = await sanitizeText(trimStr(row[COL.AREA]));
      const prioridade = await sanitizeText(trimStr(row[COL.PRIORIDADE]));

      // Cria grupo pai se necessário
      let parentId: string | null = null;
      if (macroAcao && !groupMap.has(macroAcao)) {
        sortOrder++;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: grupo, error: grupoErr } = await supabase
          .from("action_items")
          .insert({
            plan_id: planId,
            number: String(sortOrder),
            sort_order: sortOrder,
            action: await sanitizeText(macroAcao),
            tipo_pa: tipoPa,
            area,
            prioridade,
            status: 1,
          } as any)
          .select("id")
          .single();
        if (grupoErr || !grupo) {
          errors.push(`Erro ao criar grupo "${macroAcao}": ${grupoErr?.message}`);
          continue;
        }
        groupMap.set(macroAcao, grupo.id);
        created++;
      }
      if (macroAcao) parentId = groupMap.get(macroAcao) ?? null;

      sortOrder++;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: itemErr } = await supabase.from("action_items").insert({
        plan_id: planId,
        parent_id: parentId,
        number: parentId ? `${groupMap.size}.${sortOrder}` : String(sortOrder),
        sort_order: sortOrder,
        action: await sanitizeText(acao),
        subacao: await sanitizeText(trimStr(row[COL.SUBACAO])),
        como: await sanitizeText(trimStr(row[COL.COMO])),
        where: await sanitizeText(trimStr(row[COL.ONDE])),
        responsible: await sanitizeText(trimStr(row[COL.QUEM])),
        cost: await sanitizeText(trimStr(row[COL.QUANTO])),
        tipo_pa: tipoPa,
        area,
        prioridade,
        planned_start: parseDate(row[COL.INICIO_PREV]),
        planned_end:   parseDate(row[COL.TERMINO_PREV]),
        actual_start:  parseDate(row[COL.INICIO_REAL]),
        actual_end:    parseDate(row[COL.TERMINO_REAL]),
        status: parseStatus(farolRaw),
        observations: await sanitizeText(trimStr(row[COL.OBS])),
        inscritos_esperado: parseNum(row[COL.INSC_ESP]),
        inscritos_real:     parseNum(row[COL.INSC_REAL]),
        mat_fin_esperado:   parseNum(row[COL.MATFIN_ESP]),
        mat_fin_real:       parseNum(row[COL.MATFIN_REAL]),
        mat_acad_esperado:  parseNum(row[COL.MATACD_ESP]),
        mat_acad_real:      parseNum(row[COL.MATACD_REAL]),
      } as any);

      if (itemErr) {
        errors.push(`Linha "${acao}": ${itemErr.message}`);
        skipped++;
      } else {
        created++;
      }
    }

    return NextResponse.json({ created, skipped, errors });
  } catch (err) {
    console.error("[import-plan] Error:", err);
    return NextResponse.json({ error: "Erro ao processar o arquivo." }, { status: 500 });
  }
}
