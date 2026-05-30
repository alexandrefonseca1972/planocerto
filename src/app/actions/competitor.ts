"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkPermission } from "@/app/actions/admin";
import { PERMISSIONS } from "@/lib/permissions";
import { sanitizeText, mapPgError } from "@/app/actions/_catalog-utils";
import {
  instituicaoSchema,
  cursoInstituicaoSchema,
  corpoDocenteSchema,
  mensalidadeSchema,
} from "@/lib/schemas/competitor-schemas";
import type {
  Instituicao,
  CursoInstituicao,
  CorpoDocente,
  MensalidadeConcorrente,
  InstituicaoFormState,
  CursoInstituicaoFormState,
  CorpoDocenteFormState,
  MensalidadeConcorrenteFormState,
  Modalidade,
  CursoSuperior,
  Turno,
  TipoPa,
} from "@/types/competitor";

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { getCurrentTenantId } from "@/app/actions/_helpers";

async function checkCompetitorWrite(): Promise<string | null> {
  const ok = await checkPermission(PERMISSIONS.COMPETITOR_WRITE);
  if (!ok) return "Acesso negado.";
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return "Selecione uma empresa.";
  return null;
}

const REVALIDATE_PATH = "/benchmarking";

// ─── Catálogos (read-only) ────────────────────────────────────────────────────

export async function getModalidades(): Promise<Modalidade[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("modalidades")
      .select("*")
      .order("sort_order");
    return (data || []) as Modalidade[];
  } catch {
    return [];
  }
}

export async function getCursosSuperiores(): Promise<CursoSuperior[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("cursos_superiores")
      .select("*")
      .order("sort_order");
    return (data || []) as CursoSuperior[];
  } catch {
    return [];
  }
}

export async function getTurnos(): Promise<Turno[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("turnos")
      .select("*")
      .order("sort_order");
    return (data || []) as Turno[];
  } catch {
    return [];
  }
}

export async function getTiposPa(): Promise<TipoPa[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tipos_pa")
      .select("*")
      .order("sort_order");
    return (data || []) as TipoPa[];
  } catch {
    return [];
  }
}

// ─── Instituicões ─────────────────────────────────────────────────────────────

export async function getInstituicoes(): Promise<Instituicao[]> {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return [];
    const supabase = await createClient();
    const { data } = await supabase
      .from("instituicoes")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("nome");
    return (data || []) as Instituicao[];
  } catch {
    return [];
  }
}

export async function getInstituicao(id: string): Promise<Instituicao | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("instituicoes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data || null) as Instituicao | null;
  } catch {
    return null;
  }
}

export async function upsertInstituicao(
  _prev: InstituicaoFormState,
  formData: FormData,
): Promise<InstituicaoFormState> {
  try {
    const guard = await checkCompetitorWrite();
    if (guard) return { message: guard };

    const tenantId = await getCurrentTenantId();
    if (!tenantId) return { message: "Selecione uma empresa." };

    const id = formData.get("id") as string | null;

    const payload: Record<string, unknown> = {
      nome: await sanitizeText(formData.get("nome"), 200),
      nome_fantasia: await sanitizeText(formData.get("nome_fantasia"), 200),
      cnpj: await sanitizeText(formData.get("cnpj"), 18),
      tipo: formData.get("tipo") || "Privada",
      grupo_economico: await sanitizeText(formData.get("grupo_economico"), 200),
      site: await sanitizeText(formData.get("site"), 500),
      unit_id: formData.get("unit_id") || null,
      observacoes: await sanitizeText(formData.get("observacoes"), 500),
      active: formData.get("active") !== "false",
    };

    const v = instituicaoSchema.safeParse(payload);
    if (!v.success) {
      return {
        errors: v.error.flatten().fieldErrors,
        message: "Verifique os campos.",
      };
    }

    const supabase = await createClient();
    if (id) {
      const { error } = await supabase
        .from("instituicoes")
        .update({ ...v.data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return { message: await mapPgError(error, "Instituição") };
    } else {
      const { error } = await supabase
        .from("instituicoes")
        .insert({ ...v.data, tenant_id: tenantId });
      if (error) return { message: await mapPgError(error, "Instituição") };
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true, message: id ? "Instituição atualizada!" : "Instituição criada!" };
  } catch {
    return { message: "Serviço indisponível." };
  }
}

export async function deleteInstituicao(
  _prev: InstituicaoFormState,
  formData: FormData,
): Promise<InstituicaoFormState> {
  try {
    const guard = await checkCompetitorWrite();
    if (guard) return { message: guard };

    const id = formData.get("id") as string;
    if (!id) return { message: "ID obrigatório." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("instituicoes")
      .delete()
      .eq("id", id);
    if (error) return { message: await mapPgError(error, "Instituição") };

    revalidatePath(REVALIDATE_PATH);
    return { success: true, message: "Instituição excluída!" };
  } catch {
    return { message: "Serviço indisponível." };
  }
}

// ─── Cursos na Instituição ────────────────────────────────────────────────────

export async function getCursosInstituicao(
  instituicaoId: string,
): Promise<CursoInstituicao[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("cursos_instituicao")
      .select("*")
      .eq("instituicao_id", instituicaoId)
      .order("created_at");
    return (data || []) as CursoInstituicao[];
  } catch {
    return [];
  }
}

export async function upsertCursoInstituicao(
  _prev: CursoInstituicaoFormState,
  formData: FormData,
): Promise<CursoInstituicaoFormState> {
  try {
    const guard = await checkCompetitorWrite();
    if (guard) return { message: guard };

    const id = formData.get("id") as string | null;

    const payload: Record<string, unknown> = {
      instituicao_id: formData.get("instituicao_id") as string,
      curso_id: formData.get("curso_id") as string,
      tipo_pa_id: formData.get("tipo_pa_id") as string,
      unit_id: formData.get("unit_id") || null,
      coordenador_nome: await sanitizeText(formData.get("coordenador_nome"), 200),
      coordenador_email: await sanitizeText(formData.get("coordenador_email"), 200),
      coordenador_telefone: await sanitizeText(formData.get("coordenador_telefone"), 50),
      coordenador_lattes: await sanitizeText(formData.get("coordenador_lattes"), 500),
      observacoes: await sanitizeText(formData.get("observacoes"), 500),
    };

    const v = cursoInstituicaoSchema.safeParse(payload);
    if (!v.success) {
      return {
        errors: v.error.flatten().fieldErrors,
        message: "Verifique os campos.",
      };
    }

    const supabase = await createClient();
    if (id) {
      const { error } = await supabase
        .from("cursos_instituicao")
        .update({ ...v.data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return { message: await mapPgError(error, "Curso") };
    } else {
      const { error } = await supabase
        .from("cursos_instituicao")
        .insert(v.data);
      if (error) return { message: await mapPgError(error, "Curso") };
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true, message: id ? "Curso atualizado!" : "Curso adicionado!" };
  } catch {
    return { message: "Serviço indisponível." };
  }
}

export async function deleteCursoInstituicao(
  _prev: CursoInstituicaoFormState,
  formData: FormData,
): Promise<CursoInstituicaoFormState> {
  try {
    const guard = await checkCompetitorWrite();
    if (guard) return { message: guard };

    const id = formData.get("id") as string;
    if (!id) return { message: "ID obrigatório." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("cursos_instituicao")
      .delete()
      .eq("id", id);
    if (error) return { message: await mapPgError(error, "Curso") };

    revalidatePath(REVALIDATE_PATH);
    return { success: true, message: "Curso removido!" };
  } catch {
    return { message: "Serviço indisponível." };
  }
}

// ─── Corpo Docente ────────────────────────────────────────────────────────────

export async function getCorpoDocente(
  cursoInstituicaoId: string,
): Promise<CorpoDocente[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("corpo_docente")
      .select("*")
      .eq("curso_instituicao_id", cursoInstituicaoId)
      .order("sort_order")
      .order("nome");
    return (data || []) as CorpoDocente[];
  } catch {
    return [];
  }
}

export async function upsertCorpoDocente(
  _prev: CorpoDocenteFormState,
  formData: FormData,
): Promise<CorpoDocenteFormState> {
  try {
    const guard = await checkCompetitorWrite();
    if (guard) return { message: guard };

    const id = formData.get("id") as string | null;

    const payload: Record<string, unknown> = {
      curso_instituicao_id: formData.get("curso_instituicao_id") as string,
      nome: await sanitizeText(formData.get("nome"), 200),
      titulacao: await sanitizeText(formData.get("titulacao"), 100),
      lattes_url: await sanitizeText(formData.get("lattes_url"), 500),
      disciplina: await sanitizeText(formData.get("disciplina"), 200),
      email: await sanitizeText(formData.get("email"), 200),
      regime: await sanitizeText(formData.get("regime"), 50),
      sort_order: Number(formData.get("sort_order") || 0),
    };

    const v = corpoDocenteSchema.safeParse(payload);
    if (!v.success) {
      return {
        errors: v.error.flatten().fieldErrors,
        message: "Verifique os campos.",
      };
    }

    const supabase = await createClient();
    if (id) {
      const { error } = await supabase
        .from("corpo_docente")
        .update({ ...v.data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return { message: await mapPgError(error, "Professor") };
    } else {
      const { error } = await supabase
        .from("corpo_docente")
        .insert(v.data);
      if (error) return { message: await mapPgError(error, "Professor") };
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true, message: id ? "Professor atualizado!" : "Professor adicionado!" };
  } catch {
    return { message: "Serviço indisponível." };
  }
}

export async function deleteCorpoDocente(
  _prev: CorpoDocenteFormState,
  formData: FormData,
): Promise<CorpoDocenteFormState> {
  try {
    const guard = await checkCompetitorWrite();
    if (guard) return { message: guard };

    const id = formData.get("id") as string;
    if (!id) return { message: "ID obrigatório." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("corpo_docente")
      .delete()
      .eq("id", id);
    if (error) return { message: await mapPgError(error, "Professor") };

    revalidatePath(REVALIDATE_PATH);
    return { success: true, message: "Professor removido!" };
  } catch {
    return { message: "Serviço indisponível." };
  }
}

// ─── Mensalidades ────────────────────────────────────────────────────────────

export async function getMensalidades(
  cursoInstituicaoId: string,
): Promise<MensalidadeConcorrente[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("mensalidades_concorrentes")
      .select("*")
      .eq("curso_instituicao_id", cursoInstituicaoId)
      .order("vigencia_inicio", { ascending: false });
    return (data || []) as MensalidadeConcorrente[];
  } catch {
    return [];
  }
}

export async function upsertMensalidade(
  _prev: MensalidadeConcorrenteFormState,
  formData: FormData,
): Promise<MensalidadeConcorrenteFormState> {
  try {
    const guard = await checkCompetitorWrite();
    if (guard) return { message: guard };

    const id = formData.get("id") as string | null;

    const valorRaw = formData.get("valor");
    const valor =
      typeof valorRaw === "string"
        ? parseFloat(valorRaw.replace(/\./g, "").replace(",", "."))
        : 0;

    const payload: Record<string, unknown> = {
      curso_instituicao_id: formData.get("curso_instituicao_id") as string,
      modalidade_id: formData.get("modalidade_id") as string,
      turno_id: formData.get("turno_id") as string,
      valor,
      periodo: formData.get("periodo") || "mensal",
      desconto: await sanitizeText(formData.get("desconto"), 200),
      vigencia_inicio: formData.get("vigencia_inicio") as string,
      vigencia_fim: (formData.get("vigencia_fim") as string) || null,
      data_coleta: (formData.get("data_coleta") as string) || new Date().toISOString().split("T")[0],
      fonte: await sanitizeText(formData.get("fonte"), 300),
      observacoes: await sanitizeText(formData.get("observacoes"), 500),
    };

    const v = mensalidadeSchema.safeParse(payload);
    if (!v.success) {
      return {
        errors: v.error.flatten().fieldErrors,
        message: "Verifique os campos.",
      };
    }

    const supabase = await createClient();
    if (id) {
      const { error } = await supabase
        .from("mensalidades_concorrentes")
        .update({ ...v.data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return { message: await mapPgError(error, "Mensalidade") };
    } else {
      const { error } = await supabase
        .from("mensalidades_concorrentes")
        .insert(v.data);
      if (error) return { message: await mapPgError(error, "Mensalidade") };
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true, message: id ? "Mensalidade atualizada!" : "Mensalidade registrada!" };
  } catch {
    return { message: "Serviço indisponível." };
  }
}

export async function deleteMensalidade(
  _prev: MensalidadeConcorrenteFormState,
  formData: FormData,
): Promise<MensalidadeConcorrenteFormState> {
  try {
    const guard = await checkCompetitorWrite();
    if (guard) return { message: guard };

    const id = formData.get("id") as string;
    if (!id) return { message: "ID obrigatório." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("mensalidades_concorrentes")
      .delete()
      .eq("id", id);
    if (error) return { message: await mapPgError(error, "Mensalidade") };

    revalidatePath(REVALIDATE_PATH);
    return { success: true, message: "Mensalidade removida!" };
  } catch {
    return { message: "Serviço indisponível." };
  }
}

// ─── Fetch all courses + docentes + mensalidades for a instituicao ────────────

export async function getInstituicaoFullDetail(instituicaoId: string) {
  const [cursos, modalidades, cursosSuperiores, turnos, tiposPa] = await Promise.all([
    getCursosInstituicao(instituicaoId),
    getModalidades(),
    getCursosSuperiores(),
    getTurnos(),
    getTiposPa(),
  ]);

  const cursosComDocentes = await Promise.all(
    cursos.map(async (c) => {
      const [docentes, mensalidades] = await Promise.all([
        getCorpoDocente(c.id),
        getMensalidades(c.id),
      ]);
      return { ...c, docentes, mensalidades };
    }),
  );

  return { cursos: cursosComDocentes, modalidades, cursosSuperiores, turnos, tiposPa };
}
