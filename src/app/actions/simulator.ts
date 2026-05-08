"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type {
  SimulatorScenario,
  SimulatorChannelMetric,
  SimulatorFormState,
} from "@/types/simulator";

const scenarioSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório.").max(120),
  reference_label: z.string().max(120).trim().optional(),
  meta_real_aa: z.coerce.number().min(0).max(1).default(0.15),
  is_baseline: z.boolean().default(false),
  unit_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).trim().optional(),
});

const metricSchema = z.object({
  channel_id: z.string().uuid(),
  inscritos: z.coerce.number().int().min(0).default(0),
  mat_financeira: z.coerce.number().int().min(0).default(0),
  mat_academica: z.coerce.number().int().min(0).default(0),
});

export async function getScenarios(tenantId: string): Promise<SimulatorScenario[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("simulator_scenarios")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    return (data || []) as SimulatorScenario[];
  } catch (error) {
    console.error("[getScenarios] Error:", error);
    return [];
  }
}

export async function getScenarioMetrics(
  scenarioId: string,
): Promise<SimulatorChannelMetric[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("simulator_channel_metrics")
      .select("*")
      .eq("scenario_id", scenarioId);
    return (data || []) as SimulatorChannelMetric[];
  } catch (error) {
    console.error("[getScenarioMetrics] Error:", error);
    return [];
  }
}

export async function upsertScenario(
  _prev: SimulatorFormState,
  formData: FormData,
): Promise<SimulatorFormState> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    const scenarioId = formData.get("scenarioId") as string | null;
    const tenantId = formData.get("tenantId") as string | null;
    if (!tenantId) return { message: "Empresa obrigatória." };

    const unitIdRaw = formData.get("unit_id");
    const v = scenarioSchema.safeParse({
      name: formData.get("name") || "",
      reference_label: formData.get("reference_label") || "",
      meta_real_aa: formData.get("meta_real_aa") || 0.15,
      is_baseline:
        formData.get("is_baseline") === "on" || formData.get("is_baseline") === "true",
      unit_id: unitIdRaw && unitIdRaw !== "" ? String(unitIdRaw) : null,
      notes: formData.get("notes") || "",
    });
    if (!v.success) {
      return {
        errors: v.error.flatten().fieldErrors,
        message: "Verifique os campos.",
      };
    }

    if (scenarioId) {
      const { error } = await supabase
        .from("simulator_scenarios")
        .update({ ...v.data, updated_at: new Date().toISOString() })
        .eq("id", scenarioId);
      if (error) return { message: "Erro ao atualizar." };
    } else {
      const { error } = await supabase
        .from("simulator_scenarios")
        .insert({ ...v.data, tenant_id: tenantId, user_id: user.id });
      if (error) return { message: "Erro ao criar." };
    }
    revalidatePath("/simulador");
    return { success: true, message: scenarioId ? "Cenário atualizado!" : "Cenário criado!" };
  } catch (error) {
    console.error("[upsertScenario] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

export async function deleteScenario(
  _prev: SimulatorFormState,
  formData: FormData,
): Promise<SimulatorFormState> {
  try {
    const scenarioId = formData.get("scenarioId") as string;
    if (!scenarioId) return { message: "ID obrigatório." };
    const supabase = await createClient();
    await supabase.from("simulator_scenarios").delete().eq("id", scenarioId);
    revalidatePath("/simulador");
    return { success: true, message: "Cenário excluído!" };
  } catch (error) {
    console.error("[deleteScenario] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

export async function upsertMetric(
  scenarioId: string,
  channelId: string,
  data: { inscritos: number; mat_financeira: number; mat_academica: number },
): Promise<SimulatorFormState> {
  try {
    if (!scenarioId || !channelId) return { message: "IDs obrigatórios." };
    const v = metricSchema.safeParse({ channel_id: channelId, ...data });
    if (!v.success) {
      return {
        errors: v.error.flatten().fieldErrors,
        message: "Verifique os campos.",
      };
    }
    const supabase = await createClient();
    const { error } = await supabase
      .from("simulator_channel_metrics")
      .upsert(
        {
          scenario_id: scenarioId,
          channel_id: channelId,
          inscritos: v.data.inscritos,
          mat_financeira: v.data.mat_financeira,
          mat_academica: v.data.mat_academica,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "scenario_id,channel_id" },
      );
    if (error) return { message: "Erro ao salvar." };
    revalidatePath("/simulador");
    return { success: true, message: "Métrica salva!" };
  } catch (error) {
    console.error("[upsertMetric] Error:", error);
    return { message: "Serviço indisponível." };
  }
}
