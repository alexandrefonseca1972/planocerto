"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Tenant } from "@/types/tenant";

export const TENANT_ROLES = [
  { value: "viewer", label: "Visualizador" },
  { value: "user", label: "Usuário" },
  { value: "manager", label: "Gerente" },
  { value: "admin", label: "Admin" },
];

export function TenantRoleRow({
  tenant,
  formPrefix,
  defaultChecked = false,
  defaultRole = "user",
}: {
  tenant: Tenant;
  formPrefix: string;
  defaultChecked?: boolean;
  defaultRole?: string;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
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
          defaultValue={defaultRole}
          className="h-7 rounded border border-zinc-200 bg-white px-1.5 text-xs text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          onClick={(e) => e.stopPropagation()}
        >
          {TENANT_ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}
