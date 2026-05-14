import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type UnitRow = Pick<Database["public"]["Tables"]["units"]["Row"], "id" | "tenant_id" | "name">;

function normalizeUnitName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export async function findUnitForTenantByName(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  unitName: string,
): Promise<UnitRow | null> {
  const normalized = normalizeUnitName(unitName);
  if (!normalized) return null;

  const { data } = await supabase
    .from("units")
    .select("id, tenant_id, name")
    .eq("tenant_id", tenantId);

  return (
    (data || []).find((unit) => normalizeUnitName(unit.name) === normalized) || null
  );
}

export async function resolvePlanUnitReference(
  supabase: SupabaseClient<Database>,
  input: {
    tenantId: string;
    unitId?: string | null;
    unitName?: string | null;
    requireMatch?: boolean;
  },
): Promise<{ unitId: string | null; unitName: string; error?: string }> {
  const providedUnitName = (input.unitName || "").trim();

  if (input.unitId) {
    const { data: unit } = await supabase
      .from("units")
      .select("id, tenant_id, name")
      .eq("id", input.unitId)
      .eq("tenant_id", input.tenantId)
      .maybeSingle();

    if (unit) {
      return {
        unitId: unit.id,
        unitName: unit.name,
      };
    }

    if (input.requireMatch) {
      return {
        unitId: null,
        unitName: providedUnitName,
        error: "Unidade inválida para a empresa ativa.",
      };
    }
  }

  if (!providedUnitName) {
    return {
      unitId: null,
      unitName: "",
      error: input.requireMatch ? "Unidade obrigatória." : undefined,
    };
  }

  const matchedUnit = await findUnitForTenantByName(supabase, input.tenantId, providedUnitName);
  if (matchedUnit) {
    return {
      unitId: matchedUnit.id,
      unitName: matchedUnit.name,
    };
  }

  return {
    unitId: null,
    unitName: providedUnitName,
    error: input.requireMatch ? "Selecione uma unidade oficial cadastrada." : undefined,
  };
}

export async function resolvePlanUnitDisplayName(
  supabase: SupabaseClient<Database>,
  input: {
    tenantId: string;
    unitId?: string | null;
    unitName?: string | null;
  },
): Promise<string> {
  const resolved = await resolvePlanUnitReference(supabase, {
    tenantId: input.tenantId,
    unitId: input.unitId,
    unitName: input.unitName,
    requireMatch: false,
  });

  return resolved.unitName;
}
