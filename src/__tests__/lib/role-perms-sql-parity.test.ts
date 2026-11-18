import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROLES, ALL_PERMISSIONS } from "@/lib/permissions";

// role_has_perm() (migration 077) espelha ROLES no banco. Se um papel embutido
// mudar aqui, crie uma migration nova redefinindo role_has_perm().
const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/077_write_policies_require_permissions.sql"),
  "utf8",
);

function sqlArray(role: string): string[] {
  const m = sql.match(new RegExp(`WHEN '${role}'\\s+THEN p_perm (?:=|<>) (?:ANY|ALL) \\(ARRAY\\[([^\\]]*)\\]`));
  if (!m) throw new Error(`papel ${role} não encontrado em role_has_perm()`);
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort();
}

describe("role_has_perm() em SQL espelha ROLES", () => {
  it.each(["user", "viewer"])("%s: mesma lista de permissões", (role) => {
    expect(sqlArray(role)).toEqual([...ROLES[role].permissions].sort());
  });

  it("manager: mesmas exclusões", () => {
    const excluded = ALL_PERMISSIONS.filter((p) => !ROLES.manager.permissions.includes(p)).sort();
    expect(sqlArray("manager")).toEqual(excluded);
  });

  it("admin e super_admin: todas as permissões", () => {
    expect(ROLES.admin.permissions.length).toBe(ALL_PERMISSIONS.length);
    expect(ROLES.super_admin.permissions.length).toBe(ALL_PERMISSIONS.length);
    expect(sql).toMatch(/WHEN 'super_admin' THEN true/);
    expect(sql).toMatch(/WHEN 'admin'\s+THEN true/);
  });
});
