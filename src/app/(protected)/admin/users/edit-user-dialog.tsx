"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Building2, MapPin, Building, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitize } from "@/lib/sanitize";
import type { AdminFormState, AreaOption, UnitOption, RoleRow } from "@/app/actions/admin";
import type { Profile } from "@/types/auth";
import type { Tenant } from "@/types/tenant";
import { PermissionManager } from "@/components/admin/permission-manager";
import { TenantRoleRow } from "./tenant-role-row";
import { ScopePicker } from "./scope-picker";
import { EffectivePermissions } from "./effective-permissions";

export function EditUserDialog({
  user,
  state,
  action,
  isPending,
  onClose,
  tenants = [],
  selectedTenantIds = [],
  selectedTenantRoles = {},
  areas = [],
  units = [],
  selectedAreaIds = [],
  selectedUnitIds = [],
  customRoles = [],
  isSuperAdmin = false,
}: {
  user: Profile;
  state: AdminFormState;
  action: (payload: FormData) => void;
  isPending: boolean;
  onClose: () => void;
  tenants: Tenant[];
  selectedTenantIds: string[];
  selectedTenantRoles?: Record<string, string>;
  areas?: AreaOption[];
  units?: UnitOption[];
  selectedAreaIds?: string[];
  selectedUnitIds?: string[];
  customRoles?: RoleRow[];
  isSuperAdmin?: boolean;
}) {
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    user.permissions || {}
  );
  const [currentRole, setCurrentRole] = useState(user.role);

  const permissionsJson = JSON.stringify(permissions);

  const handlePermissionsChange = (newPerms: Record<string, boolean>) => {
    setPermissions(newPerms);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentRole(e.target.value);
    setPermissions({});
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-900/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="my-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Editar usuário
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={action} className="flex flex-1 min-h-0 flex-col">
          <input type="hidden" name="userId" value={user.id} />

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">

          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              value={user.email}
              disabled
              className="text-zinc-400"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              name="name"
              placeholder="Nome completo"
              defaultValue={user.name}
              required
              onChange={(e) => {
                e.target.value = sanitize(e.target.value);
              }}
            />
            {state.errors?.name && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {state.errors.name[0]}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-role">Papel</Label>
            <select
              id="edit-role"
              name="role"
              defaultValue={user.role}
              onChange={handleRoleChange}
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              <option value="user">Usuário</option>
              <option value="manager">Gerente</option>
              {/* Admin/Super/custom: só super_admin atribui; não-super pode manter o papel atual do alvo. */}
              {(isSuperAdmin || user.role === "admin") && <option value="admin">Admin</option>}
              {isSuperAdmin && (
                <option value="super_admin">Super Admin</option>
              )}
              <option value="viewer">Visualizador</option>
              {customRoles
                .filter((role) => isSuperAdmin || role.name === user.role)
                .map((role) => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
            </select>
            {state.errors?.role && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {state.errors.role[0]}
              </p>
            )}
          </div>

          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Permissões
            </p>
            <PermissionManager
              role={currentRole}
              overrides={user.permissions}
              onChange={handlePermissionsChange}
            />
            <input type="hidden" name="permissions" value={permissionsJson} />
          </div>

          <EffectivePermissions role={currentRole} overrides={permissions} customRoles={customRoles} />

          {tenants.length > 0 && (
            <div className="space-y-2">
              <input type="hidden" name="tenantsTouched" value="1" />
              <Label className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Empresas
              </Label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
                {tenants.map((tenant) => (
                  <TenantRoleRow
                    key={tenant.id}
                    tenant={tenant}
                    formPrefix="edit"
                    defaultChecked={selectedTenantIds.includes(tenant.id)}
                    defaultRole={selectedTenantRoles[tenant.id] || "member"}
                  />
                ))}
              </div>
              <p className="text-[11px] text-zinc-400">O papel define o acesso do usuário dentro de cada empresa.</p>
            </div>
          )}

          <ScopePicker
            id="areas"
            label="Áreas"
            icon={<MapPin className="h-3.5 w-3.5" />}
            inputName="areaIds"
            items={areas.map((a) => ({ id: a.id, label: a.name }))}
            selectedIds={selectedAreaIds}
            emptyMessage="Nenhuma área disponível."
            helperText="Restringe o acesso. Vazio = todas."
            touchedFieldName="areasTouched"
          />

          <ScopePicker
            id="units"
            label="Unidades"
            icon={<Building className="h-3.5 w-3.5" />}
            inputName="unitIds"
            items={units.map((u) => ({
              id: u.id,
              label: u.uf ? `${u.name} (${u.uf})` : u.name,
            }))}
            selectedIds={selectedUnitIds}
            emptyMessage="Nenhuma unidade disponível."
            helperText="Restringe o acesso. Vazio = todas."
            touchedFieldName="unitsTouched"
          />

          <div className="space-y-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Restrições de acesso
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Horário início</Label>
                <Input
                  name="login_start_time"
                  type="time"
                  defaultValue={user.login_start_time || ""}
                />
                {state.errors?.login_start_time && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {state.errors.login_start_time[0]}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Horário fim</Label>
                <Input
                  name="login_end_time"
                  type="time"
                  defaultValue={user.login_end_time || ""}
                />
                {state.errors?.login_end_time && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {state.errors.login_end_time[0]}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              Deixe em branco para acesso livre.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                value="true"
                defaultChecked={user.is_active}
                className="rounded"
              />
              <span className="text-xs">Conta ativa</span>
            </label>
          </div>

          {state.message && (
            <div
              className={cn(
                "rounded-md p-3 text-sm",
                state.success
                  ? "border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "border border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300"
              )}
            >
              {state.message}
            </div>
          )}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-zinc-200 bg-white px-6 py-3 dark:border-zinc-700 dark:bg-zinc-900">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isPending}>
              <Check className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
