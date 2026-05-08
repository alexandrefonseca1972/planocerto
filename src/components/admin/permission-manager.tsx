"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  ROLES,
  getPermissionsMap,
  type Permission,
} from "@/lib/permissions";

interface PermissionManagerProps {
  role: string;
  overrides?: Record<string, boolean> | null;
  onChange: (permissions: Record<string, boolean>) => void;
  readonly?: boolean;
  hideRoleSelect?: boolean;
}

export function PermissionManager({
  role,
  overrides,
  onChange,
  readonly = false,
  hideRoleSelect = false,
}: PermissionManagerProps) {
  const effectiveRole = hideRoleSelect ? "_custom" : role;
  const customPermissions = useMemo(() => overrides || {}, [overrides]);

  const effectivePermissions = useMemo(
    () => getPermissionsMap(effectiveRole, customPermissions),
    [effectiveRole, customPermissions]
  );

  const handleRoleChange = (_newRole: string) => {
    onChange({});
  };

  const handleToggle = (perm: Permission) => {
    if (readonly) return;
    const rolePerms = ROLES[effectiveRole]?.permissions || [];
    const fromRole = rolePerms.includes(perm);
    const currentEffective = effectivePermissions[perm];
    const newEffective = !currentEffective;

    const next = { ...customPermissions };
    if (newEffective === fromRole) {
      delete next[perm];
    } else {
      next[perm] = newEffective;
    }

    onChange(next);
  };

  const allPermissionsMap = useMemo(() => {
    const map: Record<Permission, { enabled: boolean; overridden: boolean }> =
      {} as Record<Permission, { enabled: boolean; overridden: boolean }>;
    const rolePerms = ROLES[effectiveRole]?.permissions || [];

    for (const perm of ALL_PERMISSIONS) {
      const fromRole = rolePerms.includes(perm);
      const overridden = perm in customPermissions;
      map[perm] = {
        enabled: overridden ? customPermissions[perm] : fromRole,
        overridden,
      };
    }
    return map;
  }, [effectiveRole, customPermissions]);

  const totalEnabled = ALL_PERMISSIONS.filter(
    (p) => effectivePermissions[p]
  ).length;

  return (
    <div className="space-y-4">
      {!hideRoleSelect && (
        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Papel
            </label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              disabled={readonly}
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              {Object.entries(ROLES).map(([key, def]) => (
                <option key={key} value={key}>
                  {def.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-400">
              {ROLES[role]?.description}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {hideRoleSelect ? "Permissões" : "Permissões individuais"}
          </span>
          <span className="text-xs text-zinc-400">
            {totalEnabled}/{ALL_PERMISSIONS.length} ativas
          </span>
        </div>

        {!hideRoleSelect && Object.keys(customPermissions).length > 0 && (
          <button
            type="button"
            onClick={() => {
              onChange({});
            }}
            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            Restaurar permissões padrão do papel
          </button>
        )}

        <div className="space-y-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {group.label}
              </p>
              {group.permissions.map((perm) => {
                const state = allPermissionsMap[perm];
                return (
                  <label
                    key={perm}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30",
                      readonly && "cursor-default"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={state.enabled}
                      onChange={() => handleToggle(perm)}
                      disabled={readonly}
                      className={cn(
                        "rounded",
                        !hideRoleSelect && state.overridden && "ring-1 ring-blue-400"
                      )}
                    />
                    <span
                      className={cn(
                        "flex-1 text-xs",
                        !hideRoleSelect && state.overridden
                          ? "font-medium text-blue-700 dark:text-blue-400"
                          : "text-zinc-700 dark:text-zinc-300"
                      )}
                    >
                      {PERMISSION_LABELS[perm]}
                    </span>
                    {!hideRoleSelect && state.overridden && (
                      <span className="text-[10px] text-blue-500">
                        personalizado
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
