"use client";

import { useActionState, useState, useCallback } from "react";
import { createRole, updateRole, deleteRole } from "@/app/actions/admin";
import type { RoleRow, RoleFormState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { PermissionManager } from "@/components/admin/permission-manager";
import { ROLES, ALL_PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Check,
  Lock,
} from "lucide-react";

const createInitialState: RoleFormState = { message: undefined };

export function RolesTable({ roles }: { roles: RoleRow[] }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleRow | null>(null);
  const [createPermissions, setCreatePermissions] = useState<Record<string, boolean>>({});
  const [editPermissions, setEditPermissions] = useState<Record<string, boolean>>({});

  const [createState, createAction, isCreating] = useActionState(createRole, createInitialState);
  const [updateState, updateAction, isUpdating] = useActionState(updateRole, createInitialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteRole, createInitialState);

  const builtInRoles = Object.entries(ROLES);
  const customRoles = roles.filter((r) => !r.is_system);

  const handleEditClick = useCallback((role: RoleRow) => {
    setEditPermissions(role.permissions || {});
    setEditingRole(role);
  }, []);

  const handleCreateClose = useCallback(() => {
    setShowCreateDialog(false);
    setCreatePermissions({});
  }, []);

  const handleEditClose = useCallback(() => {
    setEditingRole(null);
    setEditPermissions({});
  }, []);

  const statusMessage = (state: RoleFormState) => {
    if (!state.message) return null;
    return (
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
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Papéis e Permissões
            </CardTitle>
            <Button onClick={() => { setCreatePermissions({}); setShowCreateDialog(true); }}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo papel</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Built-in system roles */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Papéis do Sistema
              </h3>
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                      <th className="px-4 py-3 font-medium text-zinc-500">Papel</th>
                      <th className="px-4 py-3 font-medium text-zinc-500">Descrição</th>
                      <th className="px-4 py-3 font-medium text-zinc-500">Permissões</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {builtInRoles.map(([key, def]) => (
                      <tr key={key} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Lock className="h-3.5 w-3.5 text-zinc-400" />
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">{def.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{def.description}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-zinc-500">
                            {def.permissions.length} de {ALL_PERMISSIONS.length}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Custom roles */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Papéis Customizados ({customRoles.length})
              </h3>
              {customRoles.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-600">
                  <Shield className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                  <p className="mt-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Nenhum papel customizado
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Crie papéis com conjuntos específicos de permissões.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                        <th className="px-4 py-3 font-medium text-zinc-500">Papel</th>
                        <th className="px-4 py-3 font-medium text-zinc-500">Descrição</th>
                        <th className="px-4 py-3 font-medium text-zinc-500">Permissões</th>
                        <th className="px-4 py-3 text-right font-medium text-zinc-500">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {customRoles.map((role) => (
                        <tr key={role.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">{role.name}</span>
                          </td>
                          <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                            {role.description || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-zinc-500">
                              {Object.values(role.permissions || {}).filter(Boolean).length} de {ALL_PERMISSIONS.length}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(role)}
                                aria-label={`Editar ${role.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingRole(role)}
                                aria-label={`Excluir ${role.name}`}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <AlertDialog open={showCreateDialog} onOpenChange={(open) => { if (!open) handleCreateClose(); }}>
        <AlertDialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <AlertDialogHeader className="shrink-0">
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Criar papel
            </AlertDialogTitle>
            <AlertDialogDescription>
              Defina o nome e as permissões do novo papel.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form action={createAction} className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="space-y-1.5">
                <Label htmlFor="role-name">Nome</Label>
                <Input id="role-name" name="name" placeholder="Ex: Editor Regional" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role-desc">Descrição</Label>
                <Input id="role-desc" name="description" placeholder="Descrição do papel" />
              </div>

              <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
                <PermissionManager
                  role="user"
                  overrides={createPermissions}
                  onChange={setCreatePermissions}
                  hideRoleSelect
                />
                <input type="hidden" name="permissions" value={JSON.stringify(createPermissions)} />
              </div>

              {statusMessage(createState)}
            </div>

            <AlertDialogFooter className="shrink-0 pt-3">
              <AlertDialogCancel onClick={handleCreateClose}>Cancelar</AlertDialogCancel>
              <Button type="submit" isLoading={isCreating}>
                <Check className="h-4 w-4" />
                Criar
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Role Dialog */}
      <AlertDialog open={!!editingRole} onOpenChange={(open) => { if (!open) handleEditClose(); }}>
        {editingRole && (
          <AlertDialogContent className="max-w-lg max-h-[90vh] flex flex-col">
            <AlertDialogHeader className="shrink-0">
              <AlertDialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Editar papel
              </AlertDialogTitle>
              <AlertDialogDescription>
                Altere o nome e as permissões do papel.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form action={updateAction} className="flex flex-col min-h-0 flex-1">
              <input type="hidden" name="roleId" value={editingRole.id} />

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-role-name">Nome</Label>
                  <Input id="edit-role-name" name="name" defaultValue={editingRole.name} required />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-role-desc">Descrição</Label>
                  <Input id="edit-role-desc" name="description" defaultValue={editingRole.description || ""} />
                </div>

                <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  <PermissionManager
                    role="user"
                    overrides={editPermissions}
                    onChange={setEditPermissions}
                    hideRoleSelect
                  />
                  <input type="hidden" name="permissions" value={JSON.stringify(editPermissions)} />
                </div>

                {statusMessage(updateState)}
              </div>

              <AlertDialogFooter className="shrink-0 pt-3">
                <AlertDialogCancel onClick={handleEditClose}>Cancelar</AlertDialogCancel>
                <Button type="submit" isLoading={isUpdating}>
                  <Check className="h-4 w-4" />
                  Salvar
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        )}
      </AlertDialog>

      {/* Delete Role Dialog */}
      <AlertDialog
        open={!!deletingRole}
        onOpenChange={(open) => { if (!open) setDeletingRole(null); }}
      >
        {deletingRole && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir papel</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o papel{" "}
                <strong className="text-zinc-900 dark:text-zinc-50">
                  {deletingRole.name}
                </strong>
                ? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {statusMessage(deleteState)}

            <form action={deleteAction}>
              <input type="hidden" name="roleId" value={deletingRole.id} />
              <AlertDialogFooter>
                <AlertDialogCancel />
                <Button type="submit" variant="destructive" isLoading={isDeleting}>
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  );
}
