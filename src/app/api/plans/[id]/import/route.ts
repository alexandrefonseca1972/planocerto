import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkPermission } from "@/app/actions/admin";
import { PERMISSIONS } from "@/lib/permissions";
import { isValidUuid } from "@/lib/validations/uuid";
import {
  ACCEPTED_EXTS,
  MAX_FILE_BYTES,
  MAX_IMPORT_ITEMS,
  COL,
  trimStr,
  validatePlanoHeaders,
  findPlanoSheet,
} from "@/lib/planos-import";
import { importPlanItems } from "@/lib/planos-import-server";

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

    // Verifica acesso ao plano (RLS filtra: só retorna se o usuário pode lê-lo).
    const { data: plan } = await supabase
      .from("action_plans")
      .select("id, tenant_id")
      .eq("id", planId)
      .single();
    if (!plan) return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });

    // Mesma permissão exigida pelas actions de edição de itens — sem isso,
    // qualquer membro do tenant (inclusive Visualizador) poderia inserir
    // itens via chamada direta à API (o RLS de INSERT não distingue papel).
    const canUpdate = await checkPermission(PERMISSIONS.PLANS_UPDATE, plan.tenant_id);
    if (!canUpdate) return NextResponse.json({ error: "Sem permissão para editar planos." }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });

    // Guardas server-side (espelham o upload-batch).
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
    if (!ACCEPTED_EXTS.has(ext)) {
      return NextResponse.json({ error: "Tipo de arquivo não suportado. Use .xlsx, .xlsb ou .xls." }, { status: 422 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Arquivo excede o limite de 20 MB." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });

    // Com múltiplas abas, considera SEMPRE a aba "PLANO DE AÇÃO" — nunca outra.
    const sheetName = findPlanoSheet(wb.SheetNames);
    const ws = sheetName ? wb.Sheets[sheetName] : undefined;
    if (!sheetName || !ws) {
      return NextResponse.json(
        { error: `Aba "PLANO DE AÇÃO" não encontrada (abas do arquivo: ${wb.SheetNames.join(", ")}).` },
        { status: 422 },
      );
    }

    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    // Valida estrutura contra o modelo padrão.
    const { headerRow, errors: headerErrors } = validatePlanoHeaders(rows);
    if (headerErrors.length > 0) {
      return NextResponse.json(
        { error: "Estrutura do arquivo não corresponde ao modelo.", details: headerErrors },
        { status: 422 },
      );
    }

    const dataRows = rows.slice(headerRow + 1);

    const actionRows = dataRows.filter((r) => trimStr((r as unknown[])[COL.ACAO]).length > 0).length;
    if (actionRows > MAX_IMPORT_ITEMS) {
      return NextResponse.json(
        { error: `Arquivo com ${actionRows} ações — máximo de ${MAX_IMPORT_ITEMS} por arquivo.` },
        { status: 422 },
      );
    }

    // Anexa após os itens existentes para não colidir o sort_order.
    const { data: maxRow } = await supabase
      .from("action_items")
      .select("sort_order")
      .eq("plan_id", planId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const baseSort = maxRow?.sort_order ?? 0;

    const { created, skipped, errors } = await importPlanItems(supabase, planId, dataRows, { baseSort });

    await supabase
      .from("action_plans")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", planId);

    return NextResponse.json({ created, skipped, errors });
  } catch (err) {
    console.error("[import-plan] Error:", err);
    return NextResponse.json({ error: "Erro ao processar o arquivo." }, { status: 500 });
  }
}
