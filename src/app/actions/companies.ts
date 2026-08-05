"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sanitizedString } from "@/lib/validation/sanitize";
import { latitude as latSchema, longitude as lngSchema } from "@/lib/schemas/geo-schema";
import type { Company, CompanyFormState } from "@/types/company";

const companySchema = z.object({
  unit_id: z.string().uuid().nullable().optional(),
  latitude: latSchema(),
  longitude: lngSchema(),
  conveniado: z.boolean().default(false),
  cluster: sanitizedString({ max: 100 }).optional(),
  segmento: sanitizedString({ max: 100 }).optional(),
  cnpj: z.string().max(20).trim().optional(),
  nome_fantasia: sanitizedString({ min: 2, max: 200, minMsg: "Nome obrigatório." }),
  chance_contato: z.enum(["", "Alta", "Media", "Baixa"]).default(""),
  faixa_funcionarios: sanitizedString({ max: 50 }).optional(),
  endereco: sanitizedString({ max: 300 }).optional(),
  bairro: sanitizedString({ max: 100 }).optional(),
  municipio: sanitizedString({ max: 100 }).optional(),
  uf: z.string().max(2).trim().optional(),
  pais: sanitizedString({ max: 50 }).default("Brasil"),
  responsavel_nome: sanitizedString({ max: 200 }).optional(),
  responsavel_cargo: sanitizedString({ max: 100 }).optional(),
  contato_whatsapp: z.string().max(50).trim().optional(),
  email: z.string().max(200).trim().optional(),
  link_facebook: z.string().max(300).trim().optional(),
  link_instagram: z.string().max(300).trim().optional(),
  consultor: sanitizedString({ max: 200 }).optional(),
  data_primeira_visita: z.string().optional().nullable(),
  data_previsao_retorno: z.string().optional().nullable(),
  data_retorno_real: z.string().optional().nullable(),
  qtd_oportunidade: z.coerce.number().int().min(0).default(0),
  inscritos_real: z.coerce.number().int().min(0).default(0),
  financeira_real: z.coerce.number().int().min(0).default(0),
  academica_real: z.coerce.number().int().min(0).default(0),
  comentarios: sanitizedString({ max: 2000 }).optional(),
});

export async function getCompanies(tenantId: string): Promise<Company[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("nome_fantasia");
    return (data || []) as Company[];
  } catch (error) {
    console.error("[getCompanies] Error:", error);
    return [];
  }
}

function readForm(formData: FormData): Record<string, unknown> {
  const get = (k: string) => formData.get(k);
  const unitId = get("unit_id");
  return {
    unit_id: unitId && unitId !== "" ? String(unitId) : null,
    latitude: get("latitude"),
    longitude: get("longitude"),
    conveniado: get("conveniado") === "on" || get("conveniado") === "true",
    cluster: get("cluster") || "",
    segmento: get("segmento") || "",
    cnpj: get("cnpj") || "",
    nome_fantasia: get("nome_fantasia") || "",
    chance_contato: get("chance_contato") || "",
    faixa_funcionarios: get("faixa_funcionarios") || "",
    endereco: get("endereco") || "",
    bairro: get("bairro") || "",
    municipio: get("municipio") || "",
    uf: get("uf") || "",
    pais: get("pais") || "Brasil",
    responsavel_nome: get("responsavel_nome") || "",
    responsavel_cargo: get("responsavel_cargo") || "",
    contato_whatsapp: get("contato_whatsapp") || "",
    email: get("email") || "",
    link_facebook: get("link_facebook") || "",
    link_instagram: get("link_instagram") || "",
    consultor: get("consultor") || "",
    data_primeira_visita: get("data_primeira_visita") || null,
    data_previsao_retorno: get("data_previsao_retorno") || null,
    data_retorno_real: get("data_retorno_real") || null,
    qtd_oportunidade: get("qtd_oportunidade") || 0,
    inscritos_real: get("inscritos_real") || 0,
    financeira_real: get("financeira_real") || 0,
    academica_real: get("academica_real") || 0,
    comentarios: get("comentarios") || "",
  };
}

export async function upsertCompany(
  _prev: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    const companyId = formData.get("companyId") as string | null;
    const tenantId = formData.get("tenantId") as string | null;
    if (!tenantId) return { message: "Empresa (tenant) obrigatória." };

    const v = companySchema.safeParse(readForm(formData));
    if (!v.success) {
      return {
        errors: v.error.flatten().fieldErrors,
        message: "Verifique os campos.",
      };
    }

    const payload = {
      ...v.data,
      data_primeira_visita: v.data.data_primeira_visita || null,
      data_previsao_retorno: v.data.data_previsao_retorno || null,
      data_retorno_real: v.data.data_retorno_real || null,
    };

    if (companyId) {
      const { error } = await supabase
        .from("companies")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", companyId);
      if (error) return { message: "Erro ao atualizar." };
    } else {
      const { error } = await supabase
        .from("companies")
        .insert({ ...payload, tenant_id: tenantId, user_id: user.id });
      if (error) return { message: "Erro ao criar." };
    }
    revalidatePath("/empresas");
    return { success: true, message: companyId ? "Empresa atualizada!" : "Empresa criada!" };
  } catch (error) {
    console.error("[upsertCompany] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

const assignCompaniesSchema = z.object({
  ids: z
    .array(z.string().uuid())
    .min(1, "Selecione ao menos uma empresa.")
    .max(500, "Máximo de 500 por vez."),
  unitId: z.string().uuid().nullable(),
});

/**
 * Associa (ou desassocia, com unitId=null) várias empresas a uma unidade de
 * uma vez. RLS de `companies` garante o escopo do tenant; `unitId` é validado
 * contra `units`.
 */
export async function assignCompaniesToUnit(
  ids: string[],
  unitId: string | null,
): Promise<{ success?: boolean; updated?: number; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    const v = assignCompaniesSchema.safeParse({ ids, unitId });
    if (!v.success) return { message: v.error.issues[0]?.message ?? "Dados inválidos." };

    if (v.data.unitId) {
      const { data: unit } = await supabase
        .from("units")
        .select("id")
        .eq("id", v.data.unitId)
        .maybeSingle();
      if (!unit) return { message: "Unidade inválida." };
    }

    const { error, count } = await supabase
      .from("companies")
      .update(
        { unit_id: v.data.unitId, updated_at: new Date().toISOString() },
        { count: "exact" },
      )
      .in("id", v.data.ids);
    if (error) {
      console.error("[assignCompaniesToUnit]", error);
      return { message: "Erro ao associar empresas." };
    }

    revalidatePath("/empresas");
    const n = count ?? v.data.ids.length;
    return {
      success: true,
      updated: n,
      message: v.data.unitId
        ? `${n} empresa(s) associada(s) à unidade.`
        : `${n} empresa(s) removida(s) da unidade.`,
    };
  } catch (error) {
    console.error("[assignCompaniesToUnit] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

export async function deleteCompany(
  _prev: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  try {
    const companyId = formData.get("companyId") as string;
    if (!companyId) return { message: "ID obrigatório." };
    const supabase = await createClient();
    await supabase.from("companies").delete().eq("id", companyId);
    revalidatePath("/empresas");
    return { success: true, message: "Empresa excluída!" };
  } catch (error) {
    console.error("[deleteCompany] Error:", error);
    return { message: "Serviço indisponível." };
  }
}
