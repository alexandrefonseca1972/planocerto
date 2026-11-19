import { describe, it, expect, vi } from "vitest";
import { createPlan } from "@/app/actions/action-plan";
import { createClient } from "@/lib/supabase/server";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/app/actions/admin", () => ({ checkPermission: vi.fn(() => Promise.resolve(true)) }));

const TENANT = "550e8400-e29b-41d4-a716-446655440010";
const UNIT = "550e8400-e29b-41d4-a716-446655440011";

// Cadeia thenable: qualquer método devolve a própria cadeia; await resolve `result`.
function chain(result: unknown, calls: unknown[][] = []) {
  const c: Record<string, unknown> = {};
  for (const m of ["select", "eq", "ilike", "insert"]) c[m] = vi.fn((...a: unknown[]) => { calls.push([m, ...a]); return c; });
  c.maybeSingle = () => Promise.resolve(result);
  c.single = () => Promise.resolve(result);
  c.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
  return c;
}

function mockDb(existingActive: number) {
  const dupCalls: unknown[][] = [];
  const insert = vi.fn(() => chain({ data: { id: "new" }, error: null }));
  const supabase = {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }) },
    from: vi.fn((table: string) => {
      if (table === "units") return chain({ data: { id: UNIT, tenant_id: TENANT, name: "Ananindeua" } });
      if (table === "action_plans") return { ...chain({ count: existingActive, error: null }, dupCalls), insert };
      return chain({ error: null }); // plan_audit_log
    }),
  };
  vi.mocked(createClient).mockResolvedValue(supabase as never);
  return { insert, dupCalls };
}

function form(extra: Record<string, string> = {}) {
  const fd = new FormData();
  Object.entries({
    tenantId: TENANT, title: "Ananindeua", unit_id: UNIT, unit: "", director: "", goal: "",
    status: "active", exercicio: "2026", budget_limit: "", visibility: "public", ...extra,
  }).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("createPlan — plano duplicado (mesmo título, unidade e exercício)", () => {
  it("bloqueia plano ativo com mesmo título, unidade e exercício", async () => {
    const { insert } = mockDb(1);
    const r = await createPlan({}, form());
    expect(r.message).toBe('Já existe um plano ativo "Ananindeua" de Ananindeua para o exercício 2026.');
    expect(insert).not.toHaveBeenCalled();
  });

  it("filtra pelo título, escapando curingas do LIKE", async () => {
    const { dupCalls } = mockDb(0);
    await createPlan({}, form({ title: "Meta 50%_A" }));
    expect(dupCalls).toContainEqual(["ilike", "title", "Meta 50\\%\\_A"]);
  });

  it("cria quando não há plano ativo com o mesmo título na unidade/exercício", async () => {
    const { insert } = mockDb(0);
    const r = await createPlan({}, form());
    expect(r.success).toBe(true);
    expect(insert).toHaveBeenCalledOnce();
  });

  it("sem exercício informado, compara com o ano atual (default do banco)", async () => {
    const { dupCalls } = mockDb(0);
    await createPlan({}, form({ exercicio: "" }));
    expect(dupCalls).toContainEqual(["eq", "exercicio", new Date().getFullYear()]);
  });
});
