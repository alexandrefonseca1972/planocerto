"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Check } from "lucide-react";
import { getPermissionsMap, PERMISSION_GROUPS, PERMISSION_LABELS, buildCustomRolesMap, type Permission } from "@/lib/permissions";
import type { RoleRow } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

function PermissionBadges({ effective }: { effective: Record<string, boolean> }) {
  return (
    <div className="mt-2 space-y-2">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{group.label}</p>
          <div className="flex flex-wrap gap-1">
            {group.permissions.map((perm) => (
              <span
                key={perm}
                className={cn(
                  "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]",
                  effective[perm]
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-zinc-100 text-zinc-400 line-through dark:bg-zinc-800 dark:text-zinc-500"
                )}
              >
                {effective[perm] && <Check className="h-2.5 w-2.5" />}
                {PERMISSION_LABELS[perm]}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PermissionSection({
  title,
  role,
  overrides,
  customRolesMap,
  defaultExpanded = false,
}: {
  title: string;
  role: string;
  overrides: Record<string, boolean> | null;
  customRolesMap: Record<string, Permission[]>;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const effective = getPermissionsMap(role, overrides ?? undefined, customRolesMap);
  const activeCount = Object.values(effective).filter(Boolean).length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <span className="normal-case">{title}</span>
        <span className="flex items-center gap-1 normal-case font-normal">
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {activeCount} ativas
          </span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </span>
      </button>
      {expanded && <PermissionBadges effective={effective} />}
    </div>
  );
}

export interface TenantPermissionContext {
  id: string;
  name: string;
  /** Papel de permissões específico da empresa, ou null/vazio para herdar o global. */
  permRole: string | null;
}

export function EffectivePermissions({
  role,
  overrides,
  customRoles = [],
  tenants = [],
}: {
  /** Papel global do usuário (fallback quando a empresa não tem papel específico). */
  role: string;
  overrides: Record<string, boolean>;
  customRoles?: RoleRow[];
  /** Empresas atualmente marcadas no formulário, cada uma com seu papel efetivo (ou herdado). */
  tenants?: TenantPermissionContext[];
}) {
  const [globalExpanded, setGlobalExpanded] = useState(false);

  const customRolesMap = buildCustomRolesMap(
    customRoles.map((r) => ({ name: r.name, permissions: r.permissions }))
  );

  const globalEffective = getPermissionsMap(role, overrides, customRolesMap);
  const globalActiveCount = Object.values(globalEffective).filter(Boolean).length;

  return (
    <div className="space-y-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
      <div>
        <button
          type="button"
          onClick={() => setGlobalExpanded((v) => !v)}
          className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <span>Permissões efetivas — papel global</span>
          <span className="flex items-center gap-1 normal-case font-normal">
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {globalActiveCount} ativas
            </span>
            {globalExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </span>
        </button>
        {globalExpanded && <PermissionBadges effective={globalEffective} />}
        <p className="mt-1 text-[11px] text-zinc-400">
          Vale em qualquer empresa sem papel de permissões específico definido abaixo.
        </p>
      </div>

      {tenants.length > 0 && (
        <div className="space-y-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Por empresa</p>
          {tenants.map((t) => (
            <PermissionSection
              key={t.id}
              title={`${t.name}${t.permRole ? ` — ${t.permRole}` : " (papel global)"}`}
              role={t.permRole || role}
              overrides={overrides}
              customRolesMap={customRolesMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}
