"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  sanitizeText,
  mapPgError,
  requireAdmin,
} from "@/app/actions/_catalog-utils";
import { fornecedorSchema } from "@/lib/schemas/catalog-schemas";
import { isValidCNPJ, stripFormat } from "@/lib/format-br";
import type { Fornecedor, CatalogFormState } from "@/types/catalog";

export interface CnpjLookupResult {
  success: boolean;
  message?: string;
  data?: {
    name: string;
    nome_fantasia: string;
    email: string;
    telefone: string;
    endereco: string;
    municipio: string;
    uf: string;
    cep: string;
    atividade_principal: string;
    situacao: string;
  };
}

interface BrasilApiCnpj {
  razao_social?: string;
  nome_fantasia?: string;
  email?: string;
  ddd_telefone_1?: string;
  ddd_telefone_2?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  cnae_fiscal_descricao?: string;
  descricao_situacao_cadastral?: string;
  message?: string;
  type?: string;
}

/**
 * Consulta dados de um CNPJ na Receita Federal via BrasilAPI (gratuita, pública).
 * Endpoint: https://brasilapi.com.br/api/cnpj/v1/{cnpj}
 *
 * Restrito a admin para evitar uso da app como proxy de enumeração de CNPJ.
 */
export async function lookupCnpj(cnpj: string): Promise<CnpjLookupResult> {
  try {
    const guard = await requireAdmin();
    if (guard) return { success: false, message: guard };

    const digits = stripFormat(cnpj);
    if (!isValidCNPJ(digits)) {
      return { success: false, message: "CNPJ inválido." };
    }

    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
      headers: { Accept: "application/json" },
      // Cache leve no edge para evitar bater na API a cada lookup repetido
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 404) {
      return { success: false, message: "CNPJ não encontrado na Receita Federal." };
    }
    if (res.status === 429) {
      return { success: false, message: "Muitas consultas. Aguarde um instante e tente novamente." };
    }
    if (!res.ok) {
      return { success: false, message: "Falha ao consultar CNPJ. Tente novamente." };
    }

    const j = (await res.json()) as BrasilApiCnpj;

    const ddd = j.ddd_telefone_1?.trim() || j.ddd_telefone_2?.trim() || "";
    const enderecoParts = [
      j.logradouro?.trim(),
      j.numero?.trim(),
      j.complemento?.trim(),
      j.bairro?.trim(),
    ].filter(Boolean);

    return {
      success: true,
      data: {
        name: (j.razao_social || j.nome_fantasia || "").trim(),
        nome_fantasia: (j.nome_fantasia || "").trim(),
        email: (j.email || "").trim().toLowerCase(),
        telefone: ddd,
        endereco: enderecoParts.join(", "),
        municipio: (j.municipio || "").trim(),
        uf: (j.uf || "").trim(),
        cep: (j.cep || "").trim(),
        atividade_principal: (j.cnae_fiscal_descricao || "").trim(),
        situacao: (j.descricao_situacao_cadastral || "").trim(),
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return { success: false, message: "A consulta demorou demais. Tente novamente." };
    }
    console.error("[lookupCnpj] Error:", error);
    return { success: false, message: "Serviço indisponível." };
  }
}

export async function createFornecedorRapido(
  formData: FormData,
): Promise<{ success?: boolean; message?: string; fornecedor?: Fornecedor }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    const name = ((formData.get("name") as string) || "").trim();
    if (name.length < 2) return { message: "Nome deve ter pelo menos 2 caracteres." };
    if (name.length > 120) return { message: "Nome muito longo (máx. 120 caracteres)." };

    const cnpj = await sanitizeText(formData.get("cnpj"), 20);
    const contato_email = await sanitizeText(formData.get("contato_email"), 160);
    const contato_telefone = await sanitizeText(formData.get("contato_telefone"), 40);

    const { data: profile } = await supabase
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    const { data, error } = await supabase
      .from("fornecedores")
      .insert({
        name,
        cnpj: cnpj || "",
        categoria: "",
        contato_nome: "",
        contato_email: contato_email || "",
        contato_telefone: contato_telefone || "",
        observacoes: "",
        tenant_id: profile?.active_tenant_id ?? null,
        active: true,
        sort_order: 0,
      })
      .select()
      .single();

    if (error) return { message: await mapPgError(error, "Fornecedor") };
    revalidatePath("/financeiro/contas-a-pagar");
    return { success: true, fornecedor: data as Fornecedor };
  } catch (error) {
    console.error("[createFornecedorRapido] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

export async function getFornecedores(): Promise<Fornecedor[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("fornecedores")
      .select("*")
      .order("sort_order")
      .order("name");
    return (data || []) as Fornecedor[];
  } catch (error) {
    console.error("[getFornecedores] Error:", error);
    return [];
  }
}

export async function upsertFornecedor(
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const id = formData.get("id") as string | null;

    const payload = {
      name: await sanitizeText(formData.get("name"), 120),
      cnpj: await sanitizeText(formData.get("cnpj"), 20),
      categoria: await sanitizeText(formData.get("categoria"), 80),
      contato_nome: await sanitizeText(formData.get("contato_nome"), 120),
      contato_email: await sanitizeText(formData.get("contato_email"), 160),
      contato_telefone: await sanitizeText(formData.get("contato_telefone"), 40),
      observacoes: await sanitizeText(formData.get("observacoes"), 2000),
      sort_order: formData.get("sort_order") || 0,
      active:
        formData.get("active") === "on" || formData.get("active") === "true",
    };

    const v = fornecedorSchema.safeParse(payload);
    if (!v.success) {
      return {
        errors: v.error.flatten().fieldErrors,
        message: "Verifique os campos.",
      };
    }

    const supabase = await createClient();
    if (id) {
      // Não permitimos alterar o tenant_id via form: preservamos o valor do
      // registro original. Isso evita "rebatizar" um fornecedor de tenant.
      const { error } = await supabase
        .from("fornecedores")
        .update({ ...v.data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return { message: await mapPgError(error, "Fornecedor") };
    } else {
      // Novos fornecedores são criados como globais (tenant_id NULL) — modelo
      // dos demais catálogos administrados (tipos_pa, áreas, prioridades).
      const { error } = await supabase
        .from("fornecedores")
        .insert({ ...v.data, tenant_id: null });
      if (error) return { message: await mapPgError(error, "Fornecedor") };
    }
    revalidatePath("/admin/catalogos/fornecedores");
    return { success: true, message: id ? "Fornecedor atualizado!" : "Fornecedor criado!" };
  } catch (error) {
    console.error("[upsertFornecedor] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function deleteFornecedor(
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const id = formData.get("id") as string;
    if (!id) return { message: "ID obrigatório." };
    const supabase = await createClient();
    const { error } = await supabase.from("fornecedores").delete().eq("id", id);
    if (error) return { message: await mapPgError(error, "Fornecedor") };
    revalidatePath("/admin/catalogos/fornecedores");
    return { success: true, message: "Fornecedor excluído!" };
  } catch (error) {
    console.error("[deleteFornecedor] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function toggleFornecedorActive(
  id: string,
  active: boolean,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const supabase = await createClient();
    const { error } = await supabase
      .from("fornecedores")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { message: await mapPgError(error, "Fornecedor") };
    revalidatePath("/admin/catalogos/fornecedores");
    return { success: true, message: active ? "Fornecedor ativado." : "Fornecedor desativado." };
  } catch (error) {
    console.error("[toggleFornecedorActive] Error:", error);
    return { message: "Serviço indisponível." };
  }
}
