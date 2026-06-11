// Factory server-side que constrói as operações CRUD de catálogo.
// NÃO leva "use server": exporta uma função síncrona (createCatalogCrud) e é
// consumido pelos módulos de action (tipos-pa, areas, ...), que expõem as
// actions assíncronas resultantes com a diretiva "use server".
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/validation/sanitize";
import { mapPgError, requireAdmin } from "@/app/actions/_catalog-utils";
import { logger } from "@/lib/logger";
import type { CatalogFormState } from "@/types/catalog";
import type { FinanceFormState } from "@/types/financeiro";
import type { ZodType } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const log = logger.child({ component: "catalog-crud-factory" });

function db(supabase: SupabaseClient<Database>, table: string) {
  return supabase.from(table as keyof Database["public"]["Tables"] & string) as ReturnType<SupabaseClient<Database>["from"]>;
}

export interface CatalogCrudConfig {
  table: string;
  schema: ZodType;
  label: string;
  gender?: "m" | "f";
  revalidatePaths: string[];
  revalidateTags?: Array<[string, string]>;
  nameMaxLength?: number;
  extraFields?: Record<string, { type: "string" | "number" | "boolean"; maxLen?: number }>;
  parsePayload?: (formData: FormData) => Promise<Record<string, unknown>>;
  beforeInsert?: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
  beforeUpdate?: (data: Record<string, unknown>, id: string) => Promise<Record<string, unknown>>;
  insertFn?: (supabase: Awaited<ReturnType<typeof createClient>>, data: Record<string, unknown>) => Promise<{ error: unknown }>;
  stateType?: "catalog" | "finance";
}

interface CrudResult<T> {
  getAll: () => Promise<T[]>;
  upsert: (_prev: CatalogFormState, formData: FormData) => Promise<CatalogFormState>;
  delete: (_prev: CatalogFormState, formData: FormData) => Promise<CatalogFormState>;
  toggleActive: (id: string, active: boolean) => Promise<CatalogFormState>;
}

const genderArticles: Record<string, { o: string; O: string; um: string; Um: string; criad: string; atualizad: string; excluíd: string; ativad: string; desativad: string }> = {
  m: { o: "o", O: "O", um: "um", Um: "Um", criad: "criado", atualizad: "atualizado", excluíd: "excluído", ativad: "ativado", desativad: "desativado" },
  f: { o: "a", O: "A", um: "uma", Um: "Uma", criad: "criada", atualizad: "atualizada", excluíd: "excluída", ativad: "ativada", desativad: "desativada" },
};

export function createCatalogCrud<T>(config: CatalogCrudConfig): CrudResult<T> {
  const {
    table,
    schema,
    label,
    gender = "m",
    revalidatePaths,
    revalidateTags,
    nameMaxLength = 80,
    extraFields = {},
    parsePayload,
    beforeInsert,
    beforeUpdate,
    insertFn,
  } = config;

  const g = genderArticles[gender];

  async function getAll(): Promise<T[]> {
    try {
      const supabase = await createClient();
      const { data } = await db(supabase, table)
        .select("*")
        .order("sort_order")
        .order("name");
      return (data || []) as T[];
    } catch (error) {
      log.error({ error, table }, `[getAll] Erro ao buscar ${table}`);
      return [];
    }
  }

  async function upsert(
    _prev: CatalogFormState | FinanceFormState,
    formData: FormData,
  ): Promise<CatalogFormState | FinanceFormState> {
    try {
      const guard = await requireAdmin();
      if (guard) return { message: guard };

      const id = formData.get("id") as string | null;
      const name = parsePayload
        ? ((await parsePayload(formData)) as Record<string, unknown>).name ?? await sanitizeText(formData.get("name"), nameMaxLength)
        : await sanitizeText(formData.get("name"), nameMaxLength);

      const payload: Record<string, unknown> = {
        name,
        sort_order: formData.get("sort_order") || 0,
        active: formData.get("active") === "on" || formData.get("active") === "true",
      };

      for (const [field, def] of Object.entries(extraFields)) {
        const raw = formData.get(field);
        switch (def.type) {
          case "string":
            payload[field] = await sanitizeText(raw, def.maxLen ?? 200);
            break;
          default:
            payload[field] = raw ?? "";
        }
      }

      if (beforeInsert && !id) {
        // Apply additional processing for new records
      }

      const v = schema.safeParse(payload);
      if (!v.success) {
        return {
          errors: v.error.flatten().fieldErrors,
          message: "Verifique os campos.",
        };
      }

      const supabase = await createClient();
      const data = v.data as Record<string, unknown>;

      if (id) {
        let updateData: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
        if (beforeUpdate) updateData = await beforeUpdate(updateData, id);
        const { error } = await db(supabase, table).update(updateData).eq("id", id);
        if (error) return { message: await mapPgError(error, label) };
      } else {
        let insertData: Record<string, unknown> = { ...data };
        if (beforeInsert) insertData = await beforeInsert(insertData);
        const { error } = insertFn
          ? await insertFn(supabase, insertData)
          : await db(supabase, table).insert(insertData);
        if (error) return { message: await mapPgError(error, label) };
      }

      for (const p of revalidatePaths) revalidatePath(p);
      for (const [tag, profile] of revalidateTags || []) revalidateTag(tag, profile);

      return {
        success: true,
        message: id ? `${label} ${g.atualizad}${g.O}!` : `${label} ${g.criad}${g.O}!`,
      };
    } catch (error) {
      log.error({ error, table }, `[upsert] Erro em ${table}`);
      return { message: "Serviço indisponível. Tente novamente em instantes." };
    }
  }

  async function delete_(
    _prev: CatalogFormState | FinanceFormState,
    formData: FormData,
  ): Promise<CatalogFormState | FinanceFormState> {
    try {
      const guard = await requireAdmin();
      if (guard) return { message: guard };

      const id = formData.get("id") as string;
      if (!id) return { message: "ID obrigatório." };

      const supabase = await createClient();
      const { error } = await db(supabase, table).delete().eq("id", id);
      if (error) return { message: await mapPgError(error, label) };

      for (const p of revalidatePaths) revalidatePath(p);
      for (const [tag, profile] of revalidateTags || []) revalidateTag(tag, profile);

      return { success: true, message: `${label} ${g.excluíd}${g.O}!` };
    } catch (error) {
      log.error({ error, table }, `[delete] Erro em ${table}`);
      return { message: "Serviço indisponível. Tente novamente em instantes." };
    }
  }

  async function toggleActive(
    id: string,
    active: boolean,
  ): Promise<CatalogFormState | FinanceFormState> {
    try {
      const guard = await requireAdmin();
      if (guard) return { message: guard };

      const supabase = await createClient();
      const { error } = await db(supabase, table)
        .update({ active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return { message: await mapPgError(error, label) };

      for (const p of revalidatePaths) revalidatePath(p);
      for (const [tag, profile] of revalidateTags || []) revalidateTag(tag, profile);

      return {
        success: true,
        message: active ? `${label} ${g.ativad}${g.O}.` : `${label} ${g.desativad}${g.O}.`,
      };
    } catch (error) {
      log.error({ error, table }, `[toggleActive] Erro em ${table}`);
      return { message: "Serviço indisponível." };
    }
  }

  return { getAll, upsert, delete: delete_, toggleActive };
}
