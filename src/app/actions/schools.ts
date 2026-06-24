"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/errors";
import { isValidUuid } from "@/lib/validations/uuid";
import { sanitizeText } from "@/lib/validation/sanitize";
import type { School, SchoolFormState } from "@/types/school";

// Coordenada opcional: vazio/null → null; número fora da faixa → erro de validação.
const coord = (min: number, max: number) =>
  z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
      z.number().min(min, "Coordenada fora da faixa.").max(max, "Coordenada fora da faixa.").nullable(),
    )
    .optional();

const schoolSchema = z.object({
  unit_id: z.string().uuid().nullable().optional(),
  latitude: coord(-90, 90),
  longitude: coord(-180, 180),
  conveniado: z.boolean().default(false),
  prioridade: z.enum(["Alta", "Media", "Baixa"]).default("Media"),
  nome: z.string().trim().min(2, "Nome obrigatório.").max(200),
  tipo_escola: z.string().max(100).trim().optional(),
  publico_alvo: z.string().max(100).trim().optional(),
  endereco: z.string().max(300).trim().optional(),
  bairro: z.string().max(100).trim().optional(),
  municipio: z.string().max(100).trim().optional(),
  uf: z.string().max(2).trim().optional(),
  pais: z.string().max(50).trim().default("Brasil"),
  diretor: z.string().max(200).trim().optional(),
  contato_diretor: z.string().max(100).trim().optional(),
  coordenador_3ano: z.string().max(200).trim().optional(),
  contato_coordenador: z.string().max(100).trim().optional(),
  base_alunos_em: z.coerce.number().int().min(0).default(0),
  base_alunos_3ano: z.coerce.number().int().min(0).default(0),
  mensalidade_3ano: z.coerce.number().min(0).default(0),
  numero_colaboradores: z.coerce.number().int().min(0).default(0),
  consultor: z.string().max(200).trim().optional(),
  meta_inscritos: z.coerce.number().int().min(0).default(0),
  inscritos_real: z.coerce.number().int().min(0).default(0),
  meta_financeira: z.coerce.number().int().min(0).default(0),
  financeira_real: z.coerce.number().int().min(0).default(0),
  meta_academica: z.coerce.number().int().min(0).default(0),
  academica_real: z.coerce.number().int().min(0).default(0),
});

export async function getSchools(tenantId: string): Promise<School[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("schools")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("nome");
    return (data || []) as School[];
  } catch (error) {
    console.error("[getSchools] Error:", error);
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
    prioridade: get("prioridade") || "Media",
    nome: get("nome") || "",
    tipo_escola: get("tipo_escola") || "",
    publico_alvo: get("publico_alvo") || "",
    endereco: get("endereco") || "",
    bairro: get("bairro") || "",
    municipio: get("municipio") || "",
    uf: get("uf") || "",
    pais: get("pais") || "Brasil",
    diretor: get("diretor") || "",
    contato_diretor: get("contato_diretor") || "",
    coordenador_3ano: get("coordenador_3ano") || "",
    contato_coordenador: get("contato_coordenador") || "",
    base_alunos_em: get("base_alunos_em") || 0,
    base_alunos_3ano: get("base_alunos_3ano") || 0,
    mensalidade_3ano: get("mensalidade_3ano") || 0,
    numero_colaboradores: get("numero_colaboradores") || 0,
    consultor: get("consultor") || "",
    meta_inscritos: get("meta_inscritos") || 0,
    inscritos_real: get("inscritos_real") || 0,
    meta_financeira: get("meta_financeira") || 0,
    financeira_real: get("financeira_real") || 0,
    meta_academica: get("meta_academica") || 0,
    academica_real: get("academica_real") || 0,
  };
}

export async function upsertSchool(
  _prev: SchoolFormState,
  formData: FormData,
): Promise<SchoolFormState> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    const schoolId = formData.get("schoolId") as string | null;
    const tenantId = formData.get("tenantId") as string | null;
    if (!tenantId) return { message: "Empresa obrigatória." };
    if (schoolId && !isValidUuid(schoolId)) return { message: "ID da escola inválido." };

    const v = schoolSchema.safeParse(readForm(formData));
    if (!v.success) {
      return {
        errors: v.error.flatten().fieldErrors,
        message: "Verifique os campos.",
      };
    }

    const [nome, tipo_escola, publico_alvo, endereco, diretor, coordenador_3ano, consultor] = await Promise.all([
      sanitizeText(v.data.nome),
      sanitizeText(v.data.tipo_escola || ""),
      sanitizeText(v.data.publico_alvo || ""),
      sanitizeText(v.data.endereco || ""),
      sanitizeText(v.data.diretor || ""),
      sanitizeText(v.data.coordenador_3ano || ""),
      sanitizeText(v.data.consultor || ""),
    ]);
    const sanitized = {
      ...v.data,
      nome,
      tipo_escola,
      publico_alvo,
      endereco,
      diretor,
      coordenador_3ano,
      consultor,
    };

    if (schoolId) {
      const { error } = await supabase
        .from("schools")
        .update({ ...sanitized, updated_at: new Date().toISOString() })
        .eq("id", schoolId);
      if (error) return { message: "Erro ao atualizar." };
    } else {
      const { error } = await supabase
        .from("schools")
        .insert({ ...sanitized, tenant_id: tenantId, user_id: user.id });
      if (error) return { message: "Erro ao criar." };
    }
    revalidatePath("/escolas");
    return { success: true, message: schoolId ? "Escola atualizada!" : "Escola criada!" };
  } catch (error) {
    console.error("[upsertSchool] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

const assignSchoolsSchema = z.object({
  ids: z
    .array(z.string().uuid())
    .min(1, "Selecione ao menos uma escola.")
    .max(500, "Máximo de 500 por vez."),
  unitId: z.string().uuid().nullable(),
});

/**
 * Associa (ou desassocia, com unitId=null) várias escolas a uma unidade de
 * uma vez. RLS de `schools` garante o escopo do tenant; `unitId` é validado
 * contra `units` (leitura também filtrada por RLS).
 */
export async function assignSchoolsToUnit(
  ids: string[],
  unitId: string | null,
): Promise<{ success?: boolean; updated?: number; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    const v = assignSchoolsSchema.safeParse({ ids, unitId });
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
      .from("schools")
      .update(
        { unit_id: v.data.unitId, updated_at: new Date().toISOString() },
        { count: "exact" },
      )
      .in("id", v.data.ids);
    if (error) {
      logSupabaseError("assignSchoolsToUnit", error);
      return { message: "Erro ao associar escolas." };
    }

    revalidatePath("/escolas");
    const n = count ?? v.data.ids.length;
    return {
      success: true,
      updated: n,
      message: v.data.unitId
        ? `${n} escola(s) associada(s) à unidade.`
        : `${n} escola(s) removida(s) da unidade.`,
    };
  } catch (error) {
    console.error("[assignSchoolsToUnit] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

export async function deleteSchool(
  _prev: SchoolFormState,
  formData: FormData,
): Promise<SchoolFormState> {
  try {
    const schoolId = formData.get("schoolId") as string;
    if (!schoolId) return { message: "ID obrigatório." };
    if (!isValidUuid(schoolId)) return { message: "ID da escola inválido." };
    const supabase = await createClient();
    const { error } = await supabase.from("schools").delete().eq("id", schoolId);
    if (error) {
      logSupabaseError("deleteSchool", error);
      return { message: "Erro ao excluir escola." };
    }
    revalidatePath("/escolas");
    return { success: true, message: "Escola excluída!" };
  } catch (error) {
    console.error("[deleteSchool] Error:", error);
    return { message: "Serviço indisponível." };
  }
}
