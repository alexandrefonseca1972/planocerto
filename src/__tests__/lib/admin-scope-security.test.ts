import { describe, it, expect, vi, beforeEach } from "vitest";

// Varredura de segurança 20/11/2026: tomada de conta entre empresas (#1),
// listagem sem login (#2) e autoescalada de permissões (#3).

type Scope = { userId: string; isSuperAdmin: boolean; tenantIds: string[] };
let scope: Scope;
let single: Record<string, unknown>; // linha devolvida por maybeSingle(), por tabela
let lists: Record<string, unknown[]>; // linhas devolvidas por await, por tabela
let callerPerms: Set<string>;
const updateUserById = vi.fn(async () => ({ error: null }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => true) }));
vi.mock("@/lib/supabase/session", () => ({ getSessionUser: async () => (scope.userId ? { id: scope.userId } : null) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: scope.userId ? { id: scope.userId } : null } }) },
    from: () => {
      const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: { role: "manager", permissions: null } }) };
      return q;
    },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { updateUserById } },
    from: (table: string) => {
      const q: Record<string, unknown> = {};
      for (const m of ["select", "eq", "in", "order", "limit", "insert", "update", "delete"]) q[m] = () => q;
      q.maybeSingle = async () => ({ data: single[table] ?? null, error: null });
      q.then = (res: (v: unknown) => unknown) => res({ data: lists[table] ?? [], error: null });
      return q;
    },
  }),
}));
vi.mock("@/app/actions/_helpers", () => ({
  getRequesterScope: async () => scope,
  manageableUserIds: async () => new Set(["11111111-1111-4111-8111-111111111111"]),
  getAccountAccessStatus: async () => "ok",
  getEffectiveRole: async () => ({ role: "manager", permissions: null }),
  tenantsWithSingleOwner: async () => [],
  repointActiveTenant: async () => {},
}));
vi.mock("@/lib/permissions", async (orig) => {
  const real = await orig<typeof import("@/lib/permissions")>();
  return { ...real, hasPermission: (_p: unknown, _r: unknown, perm: string) => callerPerms.has(perm) };
});

import { getTenantMembers, getBulkUserTenantIds } from "@/app/actions/tenant";
import { resetUserPassword, updateUser, getAllUnits } from "@/app/actions/admin";
import { PERMISSIONS } from "@/lib/permissions";

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const VICTIM = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  scope = { userId: "mgr", isSuperAdmin: false, tenantIds: ["A"] };
  single = { profiles: { role: "user", email: "v@b.com", permissions: {} } };
  lists = {};
  callerPerms = new Set([PERMISSIONS.USERS_UPDATE]);
  updateUserById.mockClear();
});

describe("#2 consultas exigem sessão e escopo", () => {
  it("sem login não lista membros nem unidades", async () => {
    scope = { userId: "", isSuperAdmin: false, tenantIds: [] };
    lists = { tenant_members: [{ user_id: "x", tenant_id: "B" }], units: [{ id: "u", tenant_id: "B" }] };
    expect(await getTenantMembers("B")).toEqual([]);
    expect(await getAllUnits()).toEqual([]);
  });

  it("empresa fora do escopo não é listada", async () => {
    lists = {
      tenant_members: [{ user_id: "x", tenant_id: "B" }, { user_id: "x", tenant_id: "A" }],
      units: [{ id: "uA", tenant_id: "A" }, { id: "uB", tenant_id: "B" }],
    };
    expect(await getTenantMembers("B")).toEqual([]);
    expect((await getBulkUserTenantIds(["x"])).get("x")).toEqual(["A"]);
    expect((await getAllUnits()).map((u) => u.id)).toEqual(["uA"]);
  });
});

describe("#1 usuário que também está em outra empresa", () => {
  it("gerente de A não troca a senha de quem também é de B", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    lists = { tenant_members: [{ tenant_id: "A" }, { tenant_id: "B" }] };
    const r = await resetUserPassword({}, fd({ userId: VICTIM, email: "v@b.com", mode: "temp" }));
    expect(r.success).toBeFalsy();
    expect(r.message).toMatch(/outras empresas/);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("usuário só de A continua gerenciável", async () => {
    lists = { tenant_members: [{ tenant_id: "A" }] };
    const r = await resetUserPassword({}, fd({ userId: VICTIM, email: "v@b.com", mode: "temp" }));
    expect(r.success).toBe(true);
  });
});

describe("#3 não concede permissão que não possui", () => {
  it("bloqueia conceder users.delete sem tê-la", async () => {
    lists = { tenant_members: [{ tenant_id: "A" }] };
    const r = await updateUser(
      {},
      fd({ userId: VICTIM, name: "Vítima", role: "user", permissions: JSON.stringify({ [PERMISSIONS.USERS_DELETE]: true }) }),
    );
    expect(r.message).toMatch(/não possui/);
    expect(updateUserById).not.toHaveBeenCalled();
  });
});
