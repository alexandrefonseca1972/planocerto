"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/errors";
import { checkPermission } from "@/app/actions/admin";
import { sanitizeText } from "@/lib/validation/sanitize";
import { mapPgError } from "@/app/actions/_catalog-utils";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import {
  contaPagarSchema,
  pagamentoSchema,
} from "@/lib/schemas/financeiro-schemas";
import type {
  AnexoTipo,
  ContaComParcelas,
  ContaListFilters,
  ContaPagar,
  ContaAttachment,
  FinanceFormState,
  ParcelaPagar,
  ResumoFinanceiro,
} from "@/types/financeiro";
import { ANEXO_TIPOS } from "@/types/financeiro";

import { getCurrentTenantId } from "@/app/actions/_helpers";

// =========================================================================
// Helpers
// =========================================================================

async function requirePerm(perm: Permission): Promise<string | null> {
  const ok = await checkPermission(perm);
  return ok ? null : "Acesso negado para esta operação financeira.";
}

function parseContaForm(formData: FormData): {
  payload: Record<string, unknown>;
  rawParcelas: { numero: number; data_vencimento: string; valor: number }[];
} {
  const parcelasRaw = formData.get("parcelas");
  let rawParcelas: { numero: number; data_vencimento: string; valor: number }[] = [];
  if (typeof parcelasRaw === "string" && parcelasRaw) {
    try {
      const parsed = JSON.parse(parcelasRaw) as {
        numero?: number | string;
        data_vencimento?: string;
        valor?: number | string;
      }[];
      rawParcelas = parsed.map((p, idx) => ({
        numero: Number(p.numero ?? idx + 1),
        data_vencimento: String(p.data_vencimento ?? ""),
        valor: Number(p.valor ?? 0),
      }));
    } catch {
      rawParcelas = [];
    }
  }

  const payload = {
    fornecedor_id: (formData.get("fornecedor_id") as string) || null,
    categoria_id: (formData.get("categoria_id") as string) || null,
    plan_id: (formData.get("plan_id") as string) || null,
    item_id: (formData.get("item_id") as string) || null,
    descricao: String(formData.get("descricao") ?? "").trim(),
    documento: String(formData.get("documento") ?? "").trim(),
    emissao: (formData.get("emissao") as string) || null,
    valor_total: Number(formData.get("valor_total") ?? 0),
    observacoes: String(formData.get("observacoes") ?? "").trim(),
    parcelas: rawParcelas,
  };

  return { payload, rawParcelas };
}

function deriveContaDerived(c: ContaPagar, parcelas: ParcelaPagar[]): {
  total_pago: number;
  total_pendente: number;
  proxima_vencimento: string | null;
  tem_atrasada: boolean;
} {
  let total_pago = 0;
  let total_pendente = 0;
  let proxima_vencimento: string | null = null;
  let tem_atrasada = false;
  const hoje = new Date().toISOString().slice(0, 10);
  for (const p of parcelas) {
    if (p.status === "pago") total_pago += Number(p.valor_pago ?? p.valor);
    if (p.status === "pendente") {
      total_pendente += Number(p.valor);
      if (p.data_vencimento < hoje) tem_atrasada = true;
      if (!proxima_vencimento || p.data_vencimento < proxima_vencimento) {
        proxima_vencimento = p.data_vencimento;
      }
    }
  }
  return { total_pago, total_pendente, proxima_vencimento, tem_atrasada };
}

// =========================================================================
// Reads
// =========================================================================

export async function getContasPagar(
  filters: ContaListFilters = {},
): Promise<ContaComParcelas[]> {
  try {
    const supabase = await createClient();
    // Defense-in-depth: filtra por tenant no app layer além da RLS. contas_pagar
    // é puramente tenant-scoped (sem registros globais), então fail-closed se nulo.
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return [];
    let query = supabase
      .from("contas_pagar")
      .select(
        `*,
         fornecedor:fornecedores(id,name),
         categoria:categorias_despesa(id,name),
         plan:action_plans(id,title),
         item:action_items(id,action),
         parcelas:parcelas_pagar(*)`,
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (filters.status && filters.status !== "todos" && filters.status !== "atrasado") {
      query = query.eq("status", filters.status);
    }
    if (filters.fornecedor_id) query = query.eq("fornecedor_id", filters.fornecedor_id);
    if (filters.categoria_id) query = query.eq("categoria_id", filters.categoria_id);
    if (filters.plan_id) query = query.eq("plan_id", filters.plan_id);
    if (filters.item_id) query = query.eq("item_id", filters.item_id);
    // Emissão filtrada no servidor (coluna direta em contas_pagar)
    if (filters.emissao_from) query = query.gte("emissao", filters.emissao_from);
    if (filters.emissao_to)   query = query.lte("emissao", filters.emissao_to);
    if (filters.search) {
      // Sanitiza chars que poderiam quebrar a sintaxe do .or() do PostgREST:
      // %_ são wildcards de LIKE; ,()" são separadores/agrupadores do operador OR.
      const s = filters.search.replace(/[%_,()"\\]/g, "").slice(0, 100);
      if (s) {
        query = query.or(`descricao.ilike.%${s}%,documento.ilike.%${s}%`);
      }
    }

    const { data, error } = await query;
    if (error) {
      logSupabaseError("getContasPagar", error);
      return [];
    }

    type RowWithJoins = ContaPagar & {
      fornecedor: { id: string; name: string } | null;
      categoria: { id: string; name: string } | null;
      plan: { id: string; title: string } | null;
      item: { id: string; action: string } | null;
      parcelas: ParcelaPagar[] | null;
    };

    const rows = (data ?? []) as unknown as RowWithJoins[];

    let result: ContaComParcelas[] = rows.map((r) => {
      const parcelas = (r.parcelas ?? []).slice().sort((a, b) => a.numero - b.numero);
      const derived = deriveContaDerived(r, parcelas);
      return {
        ...r,
        fornecedor_nome: r.fornecedor?.name ?? null,
        categoria_nome: r.categoria?.name ?? null,
        plan_title: r.plan?.title ?? null,
        item_action: r.item?.action ?? null,
        parcelas,
        ...derived,
      };
    });

    if (filters.status === "atrasado") {
      result = result.filter((c) => c.tem_atrasada && c.status !== "cancelado");
    }
    if (filters.vencimento_from || filters.vencimento_to) {
      result = result.filter((c) =>
        c.parcelas.some((p) => {
          if (filters.vencimento_from && p.data_vencimento < filters.vencimento_from) return false;
          if (filters.vencimento_to && p.data_vencimento > filters.vencimento_to) return false;
          return true;
        }),
      );
    }
    // Emissão já filtrada no servidor — filtro JS removido

    return result;
  } catch (error) {
    console.error("[getContasPagar] Error:", error);
    return [];
  }
}

export async function getContaById(id: string): Promise<ContaComParcelas | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contas_pagar")
      .select(
        `*,
         fornecedor:fornecedores(id,name),
         categoria:categorias_despesa(id,name),
         plan:action_plans(id,title),
         item:action_items(id,action),
         parcelas:parcelas_pagar(*)`,
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    type RowWithJoins = ContaPagar & {
      fornecedor: { id: string; name: string } | null;
      categoria: { id: string; name: string } | null;
      plan: { id: string; title: string } | null;
      item: { id: string; action: string } | null;
      parcelas: ParcelaPagar[] | null;
    };
    const r = data as unknown as RowWithJoins;
    const parcelas = (r.parcelas ?? []).slice().sort((a, b) => a.numero - b.numero);
    const derived = deriveContaDerived(r, parcelas);

    return {
      ...r,
      fornecedor_nome: r.fornecedor?.name ?? null,
      categoria_nome: r.categoria?.name ?? null,
      plan_title: r.plan?.title ?? null,
      item_action: r.item?.action ?? null,
      parcelas,
      ...derived,
    };
  } catch (error) {
    console.error("[getContaById] Error:", error);
    return null;
  }
}

export async function getContasDoItem(itemId: string): Promise<ContaComParcelas[]> {
  return getContasPagar({ item_id: itemId, status: "todos" });
}

export interface ItemContasSummary {
  count: number;
  total_em_aberto: number;
  total_pago: number;
  tem_atrasada: boolean;
}

export async function getContasSummaryByPlan(
  planId: string,
): Promise<Record<string, ItemContasSummary>> {
  try {
    const supabase = await createClient();

    // Confirma ownership: só retorna se o plano pertence ao tenant ativo
    // do usuário (RLS de action_plans já filtra, mas explicitamos para
    // evitar retorno parcial em caso de mudança de policy futura).
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return {};

    const { data: plan } = await supabase
      .from("action_plans")
      .select("id")
      .eq("id", planId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (!plan) return {};

    const { data } = await supabase
      .from("contas_pagar")
      .select(
        `id, item_id, status,
         parcelas:parcelas_pagar(valor, valor_pago, status, data_vencimento)`,
      )
      .eq("plan_id", planId)
      .not("item_id", "is", null);

    type Row = {
      id: string;
      item_id: string;
      status: string;
      parcelas: {
        valor: number;
        valor_pago: number | null;
        status: string;
        data_vencimento: string;
      }[] | null;
    };

    const rows = (data ?? []) as unknown as Row[];
    const hoje = new Date().toISOString().slice(0, 10);
    const out: Record<string, ItemContasSummary> = {};

    for (const r of rows) {
      if (!r.item_id) continue;
      if (!out[r.item_id]) {
        out[r.item_id] = {
          count: 0,
          total_em_aberto: 0,
          total_pago: 0,
          tem_atrasada: false,
        };
      }
      const summary = out[r.item_id];
      if (r.status !== "cancelado") summary.count += 1;
      for (const p of r.parcelas ?? []) {
        if (p.status === "pago") {
          summary.total_pago += Number(p.valor_pago ?? p.valor);
        }
        if (p.status === "pendente" && r.status !== "cancelado") {
          summary.total_em_aberto += Number(p.valor);
          if (p.data_vencimento < hoje) summary.tem_atrasada = true;
        }
      }
    }
    return out;
  } catch (error) {
    console.error("[getContasSummaryByPlan] Error:", error);
    return {};
  }
}

export async function getItemBasicsForConta(itemId: string): Promise<{
  id: string;
  action: string;
  cost: string;
  plan_id: string;
  plan_title: string | null;
} | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("action_items")
      .select(
        `id, action, cost, plan_id, plan:action_plans(title)`,
      )
      .eq("id", itemId)
      .maybeSingle();
    if (!data) return null;
    type Row = {
      id: string;
      action: string;
      cost: string;
      plan_id: string;
      plan: { title: string } | null;
    };
    const row = data as unknown as Row;
    return {
      id: row.id,
      action: row.action,
      cost: row.cost,
      plan_id: row.plan_id,
      plan_title: row.plan?.title ?? null,
    };
  } catch (error) {
    console.error("[getItemBasicsForConta] Error:", error);
    return null;
  }
}

export async function getResumoContas(
  opts?: { range?: { from: string; to: string }; fornecedor_id?: string | null; ano?: number },
): Promise<ResumoFinanceiro> {
  const range = opts?.range;
  const fornecedor_id = opts?.fornecedor_id ?? null;
  // Valida ano: deve ser finito e razoável (evita NaN/Infinity do cliente)
  const anoRaw = opts?.ano;
  const ano = (Number.isFinite(anoRaw) && anoRaw! > 1900 && anoRaw! < 2200)
    ? anoRaw!
    : new Date().getFullYear();

  const empty: ResumoFinanceiro = {
    total_em_aberto: 0,
    total_atrasado: 0,
    total_pago_periodo: 0,
    contas_quantidade: 0,
    proximas_7d: [],
    vencimentos_mes: [],
    por_fornecedor: [],
    por_status: [],
    por_mes: [],
  };
  try {
    const supabase = await createClient();
    const targetTenant = await getCurrentTenantId();
    if (!targetTenant) return empty;

    let query = supabase
      .from("contas_pagar")
      .select(
        `id, descricao, status, fornecedor_id,
         fornecedor:fornecedores(id, name),
         parcelas:parcelas_pagar(id, numero, data_vencimento, valor, valor_pago, status, data_pagamento)`,
      )
      .eq("tenant_id", targetTenant);

    if (fornecedor_id) query = query.eq("fornecedor_id", fornecedor_id);

    const { data: contasData, error: contasError } = await query;
    if (contasError) {
      logSupabaseError("getResumoContas", contasError);
      return empty;
    }

    type Row = {
      id: string;
      descricao: string;
      status: string;
      fornecedor_id: string | null;
      fornecedor: { id: string; name: string } | null;
      parcelas: {
        id: string;
        numero: number;
        data_vencimento: string;
        valor: number;
        valor_pago: number | null;
        status: string;
        data_pagamento: string | null;
      }[] | null;
    };

    const rows = (contasData ?? []) as unknown as Row[];
    const hoje = new Date().toISOString().slice(0, 10);
    const limite7d = new Date();
    limite7d.setDate(limite7d.getDate() + 7);
    const limite7dStr = limite7d.toISOString().slice(0, 10);

    let total_em_aberto = 0;
    let total_atrasado = 0;
    let total_pago_periodo = 0;
    const proximas_7d: ResumoFinanceiro["proximas_7d"] = [];
    const vencimentos_mes: ResumoFinanceiro["vencimentos_mes"] = [];

    // Acumuladores para views
    const fornecedorMap = new Map<string, { nome: string; total_pago: number; total_aberto: number }>();
    const statusMap = new Map<string, { quantidade: number; valor_total: number }>();
    // por_mes: 12 meses do ano
    const mesesMap = new Map<string, { total_pago: number; total_aberto: number }>();
    for (let m = 1; m <= 12; m++) {
      mesesMap.set(`${ano}-${String(m).padStart(2, "0")}`, { total_pago: 0, total_aberto: 0 });
    }

    for (const r of rows) {
      const parcelas = r.parcelas ?? [];
      const fId = r.fornecedor_id ?? "__sem_fornecedor__";
      const fNome = r.fornecedor?.name ?? "Sem fornecedor";

      if (!fornecedorMap.has(fId)) fornecedorMap.set(fId, { nome: fNome, total_pago: 0, total_aberto: 0 });

      // por_status
      if (r.status !== "cancelado") {
        const st = statusMap.get(r.status) ?? { quantidade: 0, valor_total: 0 };
        const totalConta = parcelas.reduce((s, p) => s + Number(p.valor), 0);
        statusMap.set(r.status, { quantidade: st.quantidade + 1, valor_total: st.valor_total + totalConta });
      }

      for (const p of parcelas) {
        if (p.status === "pendente" && r.status !== "cancelado") {
          total_em_aberto += Number(p.valor);
          if (p.data_vencimento < hoje) total_atrasado += Number(p.valor);

          // próximas 7 dias
          if (p.data_vencimento >= hoje && p.data_vencimento <= limite7dStr) {
            proximas_7d.push({ parcela_id: p.id, conta_id: r.id, descricao: r.descricao, vencimento: p.data_vencimento, valor: Number(p.valor) });
          }

          // vencimentos do mês (range)
          if (range && p.data_vencimento >= range.from && p.data_vencimento <= range.to) {
            vencimentos_mes.push({ parcela_id: p.id, conta_id: r.id, descricao: r.descricao, vencimento: p.data_vencimento, valor: Number(p.valor), atrasada: p.data_vencimento < hoje });
          }

          // por_mes (aberto — usa vencimento)
          const mesVenc = p.data_vencimento.slice(0, 7);
          if (mesesMap.has(mesVenc)) {
            mesesMap.get(mesVenc)!.total_aberto += Number(p.valor);
          }

          // por_fornecedor aberto
          fornecedorMap.get(fId)!.total_aberto += Number(p.valor);
        }

        if (p.status === "pago" && p.data_pagamento) {
          const valorPago = Number(p.valor_pago ?? p.valor);

          // pago no período (range)
          if (!range || (p.data_pagamento >= range.from && p.data_pagamento <= range.to)) {
            total_pago_periodo += valorPago;
          }

          // por_mes (pago — usa data_pagamento)
          const mesPag = p.data_pagamento.slice(0, 7);
          if (mesesMap.has(mesPag)) {
            mesesMap.get(mesPag)!.total_pago += valorPago;
          }

          // por_fornecedor pago
          fornecedorMap.get(fId)!.total_pago += valorPago;
        }
      }
    }

    proximas_7d.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
    vencimentos_mes.sort((a, b) => a.vencimento.localeCompare(b.vencimento));

    const por_fornecedor = Array.from(fornecedorMap.entries())
      .map(([id, v]) => ({ fornecedor_id: id === "__sem_fornecedor__" ? null : id, fornecedor_nome: v.nome, total_pago: v.total_pago, total_aberto: v.total_aberto }))
      .filter((f) => f.total_pago > 0 || f.total_aberto > 0)
      .sort((a, b) => (b.total_pago + b.total_aberto) - (a.total_pago + a.total_aberto));

    const por_status = Array.from(statusMap.entries())
      .map(([status, v]) => ({ status, quantidade: v.quantidade, valor_total: v.valor_total }));

    const por_mes = Array.from(mesesMap.entries())
      .map(([mes, v]) => ({ mes, total_pago: v.total_pago, total_aberto: v.total_aberto }));

    return {
      total_em_aberto,
      total_atrasado,
      total_pago_periodo,
      contas_quantidade: rows.filter((r) => r.status !== "cancelado").length,
      proximas_7d: proximas_7d.slice(0, 20),
      vencimentos_mes,
      por_fornecedor,
      por_status,
      por_mes,
    };
  } catch (error) {
    console.error("[getResumoContas] Error:", error);
    return empty;
  }
}

// =========================================================================
// Writes
// =========================================================================

export async function createConta(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  try {
    const guard = await requirePerm(PERMISSIONS.FINANCE_CREATE);
    if (guard) return { message: guard };

    const tenantId = await getCurrentTenantId();
    if (!tenantId) return { message: "Empresa ativa não definida." };

    const { payload } = parseContaForm(formData);
    const v = contaPagarSchema.safeParse(payload);
    if (!v.success) {
      return {
        errors: v.error.flatten().fieldErrors,
        message: "Verifique os campos.",
      };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_conta_with_parcelas", {
      payload: {
        tenant_id: tenantId,
        plan_id: v.data.plan_id,
        item_id: v.data.item_id,
        fornecedor_id: v.data.fornecedor_id,
        categoria_id: v.data.categoria_id,
        descricao: await sanitizeText(v.data.descricao, 200),
        documento: await sanitizeText(v.data.documento ?? "", 60),
        emissao: v.data.emissao || null,
        valor_total: v.data.valor_total,
        observacoes: await sanitizeText(v.data.observacoes ?? "", 2000),
        parcelas: v.data.parcelas,
      } as never,
    });

    if (error) return { message: await mapPgError(error, "Conta") };

    revalidatePath("/financeiro");
    revalidatePath("/financeiro/contas-a-pagar");
    revalidatePath("/planos");
    return {
      success: true,
      message: "Conta criada!",
      contaId: typeof data === "string" ? data : undefined,
    };
  } catch (error) {
    console.error("[createConta] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function updateConta(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  try {
    const guard = await requirePerm(PERMISSIONS.FINANCE_UPDATE);
    if (guard) return { message: guard };

    const id = formData.get("id") as string | null;
    if (!id) return { message: "ID da conta obrigatório." };

    const { payload } = parseContaForm(formData);
    const v = contaPagarSchema.safeParse(payload);
    if (!v.success) {
      return {
        errors: v.error.flatten().fieldErrors,
        message: "Verifique os campos.",
      };
    }

    const supabase = await createClient();

    // RPC atômica: faz check de parcelas pagas, valida soma, atualiza header
    // e substitui parcelas dentro de uma única transação SQL.
    const { error } = await supabase.rpc("update_conta_with_parcelas", {
      conta_id_in: id,
      payload: {
        plan_id: v.data.plan_id,
        item_id: v.data.item_id,
        fornecedor_id: v.data.fornecedor_id,
        categoria_id: v.data.categoria_id,
        descricao: await sanitizeText(v.data.descricao, 200),
        documento: await sanitizeText(v.data.documento ?? "", 60),
        emissao: v.data.emissao || null,
        valor_total: v.data.valor_total,
        observacoes: await sanitizeText(v.data.observacoes ?? "", 2000),
        parcelas: v.data.parcelas,
      } as never,
    });

    if (error) {
      // Mensagem específica para o caso de parcelas pagas (RAISE EXCEPTION
      // do RPC vem com message contendo essa string).
      if (error.message?.includes("parcelas pagas")) {
        return {
          message:
            "Esta conta possui parcelas pagas. Estorne os pagamentos antes de editar.",
        };
      }
      return { message: await mapPgError(error, "Conta") };
    }

    revalidatePath("/financeiro");
    revalidatePath("/financeiro/contas-a-pagar");
    revalidatePath(`/financeiro/contas-a-pagar/${id}`);
    revalidatePath("/planos");
    return { success: true, message: "Conta atualizada!", contaId: id };
  } catch (error) {
    console.error("[updateConta] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function deleteConta(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  try {
    const guard = await requirePerm(PERMISSIONS.FINANCE_DELETE);
    if (guard) return { message: guard };

    const id = formData.get("id") as string;
    if (!id) return { message: "ID obrigatório." };

    const supabase = await createClient();
    const { data: parcelas } = await supabase
      .from("parcelas_pagar")
      .select("status")
      .eq("conta_id", id);

    const temPaga = (parcelas ?? []).some((p) => p.status === "pago");
    if (temPaga) {
      return {
        message:
          "Não é possível excluir uma conta com pagamentos registrados. Cancele a conta para preservar o histórico.",
      };
    }

    const { error } = await supabase.from("contas_pagar").delete().eq("id", id);
    if (error) return { message: await mapPgError(error, "Conta") };

    revalidatePath("/financeiro");
    revalidatePath("/financeiro/contas-a-pagar");
    revalidatePath("/planos");
    return { success: true, message: "Conta excluída!" };
  } catch (error) {
    console.error("[deleteConta] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function cancelarConta(
  id: string,
  motivo: string,
): Promise<FinanceFormState> {
  try {
    const guard = await requirePerm(PERMISSIONS.FINANCE_UPDATE);
    if (guard) return { message: guard };

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("contas_pagar")
      .select("observacoes")
      .eq("id", id)
      .maybeSingle();

    const motivoTxt = await sanitizeText(motivo, 500);
    const novaObs = motivoTxt
      ? `${existing?.observacoes ?? ""}\n[Cancelada] ${motivoTxt}`.trim()
      : existing?.observacoes ?? "";

    const { error: errParcelas } = await supabase
      .from("parcelas_pagar")
      .update({ status: "cancelado" })
      .eq("conta_id", id)
      .eq("status", "pendente");
    if (errParcelas) return { message: await mapPgError(errParcelas, "Conta") };

    const { error: errConta } = await supabase
      .from("contas_pagar")
      .update({ status: "cancelado", observacoes: novaObs })
      .eq("id", id);
    if (errConta) return { message: await mapPgError(errConta, "Conta") };

    revalidatePath("/financeiro");
    revalidatePath("/financeiro/contas-a-pagar");
    revalidatePath(`/financeiro/contas-a-pagar/${id}`);
    revalidatePath("/planos");
    return { success: true, message: "Conta cancelada." };
  } catch (error) {
    console.error("[cancelarConta] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

// =========================================================================
// Pagamentos
// =========================================================================

export async function registrarPagamento(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  try {
    const guard = await requirePerm(PERMISSIONS.FINANCE_UPDATE);
    if (guard) return { message: guard };

    const payload = {
      parcela_id: String(formData.get("parcela_id") ?? ""),
      data_pagamento: String(formData.get("data_pagamento") ?? ""),
      valor_pago: Number(formData.get("valor_pago") ?? 0),
      forma_pagamento: String(formData.get("forma_pagamento") ?? "outro"),
      observacoes: String(formData.get("observacoes") ?? "").trim(),
    };
    const v = pagamentoSchema.safeParse(payload);
    if (!v.success) {
      return {
        errors: v.error.flatten().fieldErrors,
        message: "Verifique os campos do pagamento.",
      };
    }

    const supabase = await createClient();
    const { error, data } = await supabase
      .from("parcelas_pagar")
      .update({
        status: "pago",
        data_pagamento: v.data.data_pagamento,
        valor_pago: v.data.valor_pago,
        forma_pagamento: v.data.forma_pagamento,
        observacoes: await sanitizeText(v.data.observacoes ?? "", 500),
      })
      .eq("id", v.data.parcela_id)
      .select("conta_id")
      .maybeSingle();
    if (error) return { message: await mapPgError(error, "Pagamento") };

    revalidatePath("/financeiro");
    revalidatePath("/financeiro/contas-a-pagar");
    if (data?.conta_id) {
      revalidatePath(`/financeiro/contas-a-pagar/${data.conta_id}`);
    }
    return { success: true, message: "Pagamento registrado!" };
  } catch (error) {
    console.error("[registrarPagamento] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

export async function pagarParcelasEmLote(
  parcelaIds: string[],
  dataPagamento: string,
  formaPagamento: string,
): Promise<FinanceFormState> {
  try {
    const guard = await requirePerm(PERMISSIONS.FINANCE_UPDATE);
    if (guard) return { message: guard };

    if (!parcelaIds.length) return { message: "Nenhuma parcela selecionada." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataPagamento)) {
      return { message: "Data de pagamento inválida." };
    }
    const formasValidas = [
      "pix",
      "boleto",
      "dinheiro",
      "cartao",
      "transferencia",
      "outro",
    ];
    const forma = formasValidas.includes(formaPagamento)
      ? formaPagamento
      : "outro";

    const supabase = await createClient();

    // Busca parcelas pendentes do conjunto solicitado para preencher valor_pago = valor.
    const { data: parcelas } = await supabase
      .from("parcelas_pagar")
      .select("id, conta_id, valor, numero")
      .in("id", parcelaIds)
      .eq("status", "pendente");

    if (!parcelas || parcelas.length === 0) {
      return { message: "Nenhuma parcela pendente encontrada." };
    }

    // Atualiza uma a uma — Supabase não suporta UPDATE de múltiplos valores
    // diferentes (valor_pago varia por linha) numa única chamada sem RPC.
    const failedIds: string[] = [];
    for (const p of parcelas) {
      const { error } = await supabase
        .from("parcelas_pagar")
        .update({
          status: "pago",
          data_pagamento: dataPagamento,
          valor_pago: p.valor,
          forma_pagamento: forma,
        })
        .eq("id", p.id);
      if (error) failedIds.push(p.id);
    }

    const okCount = parcelas.length - failedIds.length;
    revalidatePath("/financeiro");
    revalidatePath("/financeiro/contas-a-pagar");
    const contaId = parcelas[0]?.conta_id;
    if (contaId) revalidatePath(`/financeiro/contas-a-pagar/${contaId}`);

    if (failedIds.length === 0) {
      return { success: true, message: `${okCount} parcela(s) marcadas como pagas.` };
    }

    const failedNums = parcelas
      .filter((p) => failedIds.includes(p.id))
      .map((p) => `#${p.numero}`)
      .join(", ");
    return {
      success: okCount > 0,
      message: `${okCount} de ${parcelas.length} parcelas pagas. Falha nas parcelas: ${failedNums}.`,
      failedIds,
    };
  } catch (error) {
    console.error("[pagarParcelasEmLote] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

export async function estornarPagamento(
  parcelaId: string,
): Promise<FinanceFormState> {
  try {
    const guard = await requirePerm(PERMISSIONS.FINANCE_UPDATE);
    if (guard) return { message: guard };

    const supabase = await createClient();
    const { error, data } = await supabase
      .from("parcelas_pagar")
      .update({
        status: "pendente",
        data_pagamento: null,
        valor_pago: null,
        forma_pagamento: "",
      })
      .eq("id", parcelaId)
      .select("conta_id")
      .maybeSingle();
    if (error) return { message: await mapPgError(error, "Pagamento") };

    revalidatePath("/financeiro");
    revalidatePath("/financeiro/contas-a-pagar");
    if (data?.conta_id) {
      revalidatePath(`/financeiro/contas-a-pagar/${data.conta_id}`);
    }
    return { success: true, message: "Pagamento estornado." };
  } catch (error) {
    console.error("[estornarPagamento] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

// =========================================================================
// Anexos (metadata; o upload do binário é feito do client → storage)
// =========================================================================

export async function listarAnexos(
  contaId: string,
): Promise<ContaAttachment[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("conta_attachments")
      .select("*")
      .eq("conta_id", contaId)
      .order("created_at", { ascending: false });
    return (data ?? []) as ContaAttachment[];
  } catch (error) {
    console.error("[listarAnexos] Error:", error);
    return [];
  }
}

const ANEXO_ALLOWED_MIMES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];
const ANEXO_MAX_SIZE = 10 * 1024 * 1024;

export async function uploadAnexoConta(
  contaId: string,
  file: File,
  tipo: AnexoTipo = "outro",
): Promise<FinanceFormState> {
  try {
    const guard = await requirePerm(PERMISSIONS.FINANCE_UPDATE);
    if (guard) return { message: guard };

    if (!file || !file.size) return { message: "Arquivo inválido." };
    if (!ANEXO_ALLOWED_MIMES.includes(file.type)) {
      return { message: "Tipo de arquivo não permitido." };
    }
    if (file.size > ANEXO_MAX_SIZE) {
      return { message: "Arquivo deve ter no máximo 10MB." };
    }
    const tipoFinal: AnexoTipo = ANEXO_TIPOS.includes(tipo) ? tipo : "outro";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { message: "Sessão inválida." };

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${contaId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("contas-anexos")
      .upload(storagePath, file, { cacheControl: "3600", upsert: false });
    if (uploadError) {
      console.error("[uploadAnexoConta] Storage error:", uploadError.message);
      return { message: "Erro ao enviar arquivo." };
    }

    const { error: dbError } = await supabase.from("conta_attachments").insert({
      conta_id: contaId,
      filename: safeName,
      storage_path: storagePath,
      size: file.size,
      mime_type: file.type,
      tipo: tipoFinal,
      uploaded_by: user.id,
    });
    if (dbError) {
      await supabase.storage.from("contas-anexos").remove([storagePath]);
      return { message: await mapPgError(dbError, "Anexo") };
    }

    revalidatePath(`/financeiro/contas-a-pagar/${contaId}`);
    return { success: true, message: "Anexo enviado!" };
  } catch (error) {
    console.error("[uploadAnexoConta] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

export async function getAnexoUrl(storagePath: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("contas-anexos")
      .createSignedUrl(storagePath, 300);
    return data?.signedUrl || null;
  } catch {
    return null;
  }
}

export async function deleteAnexo(
  anexoId: string,
): Promise<FinanceFormState> {
  try {
    const guard = await requirePerm(PERMISSIONS.FINANCE_UPDATE);
    if (guard) return { message: guard };

    const supabase = await createClient();
    const { data: anexo } = await supabase
      .from("conta_attachments")
      .select("storage_path, conta_id")
      .eq("id", anexoId)
      .maybeSingle();

    if (anexo?.storage_path) {
      await supabase.storage.from("contas-anexos").remove([anexo.storage_path]);
    }

    const { error } = await supabase
      .from("conta_attachments")
      .delete()
      .eq("id", anexoId);
    if (error) return { message: await mapPgError(error, "Anexo") };

    if (anexo?.conta_id) {
      revalidatePath(`/financeiro/contas-a-pagar/${anexo.conta_id}`);
    }
    return { success: true, message: "Anexo excluído." };
  } catch (error) {
    console.error("[deleteAnexo] Error:", error);
    return { message: "Serviço indisponível." };
  }
}
