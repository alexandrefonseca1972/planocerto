import { describe, it, expect, vi, beforeEach } from "vitest";

// Tabelas simuladas: { tabela: linha retornada por maybeSingle() }
let rows: Record<string, unknown> = {};
let accessStatus = "ok";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: async () => ({ data: accessStatus, error: null }),
    from: (table: string) => {
      const q = {
        select: () => q,
        eq: () => q,
        maybeSingle: async () => ({ data: rows[table] ?? null, error: null }),
      };
      return q;
    },
  }),
}));

import { getEffectiveRole } from "@/app/actions/_helpers";

describe("getEffectiveRole exige vínculo com a empresa (achado #2)", () => {
  beforeEach(() => { rows = {}; accessStatus = "ok"; });

  it("admin global sem vínculo não tem papel na empresa", async () => {
    rows.profiles = { role: "admin", permissions: { "plans.update": true } };
    expect(await getEffectiveRole("u", "t")).toEqual({ role: "", permissions: null });
  });

  it("super_admin sem vínculo mantém papel global", async () => {
    rows.profiles = { role: "super_admin", permissions: null };
    expect((await getEffectiveRole("u", "t")).role).toBe("super_admin");
  });

  it("membro usa papel da empresa, com fallback para o global", async () => {
    rows.profiles = { role: "user", permissions: null };
    rows.tenant_members = { user_id: "u" };
    expect((await getEffectiveRole("u", "t")).role).toBe("user");
    rows.tenant_member_roles = { role: "manager" };
    expect((await getEffectiveRole("u", "t")).role).toBe("manager");
  });

  it.each(["inactive", "outside_hours", "missing"])("conta %s não tem papel (achado #4)", async (status) => {
    accessStatus = status;
    rows.profiles = { role: "admin", permissions: null };
    rows.tenant_members = { user_id: "u" };
    expect(await getEffectiveRole("u", "t")).toEqual({ role: "", permissions: null });
    expect(await getEffectiveRole("u", null)).toEqual({ role: "", permissions: null });
  });
});
