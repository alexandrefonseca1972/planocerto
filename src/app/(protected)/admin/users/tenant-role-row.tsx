"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Tenant } from "@/types/tenant";
import type { RoleRow } from "@/app/actions/admin";

// Papel de MEMBERSHIP do usuário dentro da empresa (espelha tenant_members.role).
// Distinto do papel de PERMISSÕES por empresa (tenant_member_roles.role, ver
// TenantPermRoleSelect abaixo) e do papel global (profiles.role, fallback
// quando nenhum papel de permissões é definido para a empresa).
export const TENANT_ROLES = [
  { value: "member", label: "Membro" },
  { value: "admin", label: "Admin" },
  { value: "owner", label: "Proprietário" },
];

// Valor sentinela para "usar o papel global do usuário nesta empresa" — não
// grava linha em tenant_member_roles, preserva o fallback (ver getEffectiveRole).
export const INHERIT_GLOBAL_ROLE = "";

const BUILTIN_PERM_ROLES = [
  { value: "viewer", label: "Visualizador" },
  { value: "user", label: "Usuário" },
  { value: "manager", label: "Gerente" },
];

const SUPER_ADMIN_ONLY_PERM_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

export function TenantRoleRow({
  tenant,
  formPrefix,
  defaultChecked = false,
  defaultRole = "member",
  defaultPermRole = INHERIT_GLOBAL_ROLE,
  isSuperAdmin = false,
  customRoles = [],
  onSelectionChange,
}: {
  tenant: Tenant;
  formPrefix: string;
  defaultChecked?: boolean;
  defaultRole?: string;
  defaultPermRole?: string;
  isSuperAdmin?: boolean;
  customRoles?: RoleRow[];
  /** Notifica o pai (para exibir EffectivePermissions por empresa em tempo real). */
  onSelectionChange?: (checked: boolean, permRole: string) => void;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  const [permRole, setPermRole] = useState(defaultPermRole);

  useEffect(() => {
    onSelectionChange?.(checked, permRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, permRole]);

  // Apenas super_admin define papel de empresa Admin/Proprietário. Para os
  // demais, o usuário só pode ser Membro — o servidor também impõe isso.
  const roleOptions = isSuperAdmin
    ? TENANT_ROLES
    : TENANT_ROLES.filter((r) => r.value === "member");

  // Admin/Super Admin (builtin) seguem restritos a super_admin. Papéis
  // customizados já podem ser atribuídos por admins de empresa dentro das
  // suas próprias empresas (ver resolveTenantPermRole em admin.ts).
  const permRoleOptions = [
    ...BUILTIN_PERM_ROLES,
    ...(isSuperAdmin ? SUPER_ADMIN_ONLY_PERM_ROLES : []),
    ...customRoles.map((r) => ({ value: r.name, label: r.name })),
  ];

  return (
    <div className="space-y-1 border-b border-zinc-100 py-1 last:border-b-0 dark:border-zinc-800">
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${formPrefix}-tenant-${tenant.id}`}
          name="tenantIds"
          value={tenant.id}
          checked={checked}
          onChange={() => setChecked((v) => !v)}
        />
        <label
          htmlFor={`${formPrefix}-tenant-${tenant.id}`}
          className="flex-1 cursor-pointer select-none truncate text-sm text-zinc-700 dark:text-zinc-300"
        >
          {tenant.name}
        </label>
        {checked && (
          <select
            name={`tenantRole-${tenant.id}`}
            defaultValue={isSuperAdmin ? defaultRole : "member"}
            title="Papel de gestão da empresa (governança de membership)"
            className="h-7 rounded border border-zinc-200 bg-white px-1.5 text-xs text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            onClick={(e) => e.stopPropagation()}
          >
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        )}
      </div>
      {checked && (
        <div className="flex items-center gap-1.5 pl-6">
          <span className="text-[11px] text-zinc-400">Permissões nesta empresa:</span>
          <select
            name={`tenantPermRole-${tenant.id}`}
            value={permRole}
            onChange={(e) => setPermRole(e.target.value)}
            title="Papel de permissões do usuário nesta empresa — vazio herda o papel global"
            className="h-6 flex-1 rounded border border-zinc-200 bg-white px-1.5 text-[11px] text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            onClick={(e) => e.stopPropagation()}
          >
            <option value={INHERIT_GLOBAL_ROLE}>Usar papel global</option>
            {permRoleOptions.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
