"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Check } from "lucide-react";
import { getPermissionsMap, PERMISSION_GROUPS, PERMISSION_LABELS, buildCustomRolesMap } from "@/lib/permissions";
import type { RoleRow } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

export function EffectivePermissions({
  role,
  overrides,
  customRoles = [],
}: {
  role: string;
  overrides: Record<string, boolean>;
  customRoles?: RoleRow[];
}) {
  const [expanded, setExpanded] = useState(false);

  const customRolesMap = buildCustomRolesMap(
    customRoles.map((r) => ({ name: r.name, permissions: r.permissions }))
  );
  const effective = getPermissionsMap(role, overrides, customRolesMap);
  const activeCount = Object.values(effective).filter(Boolean).length;

  return (
    <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        <span>Permissões efetivas</span>
        <span className="flex items-center gap-1 normal-case font-normal">
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {activeCount} ativas
          </span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </span>
      </button>
      {expanded && (
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
      )}
    </div>
  );
}
