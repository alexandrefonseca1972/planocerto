"use client";

import { useActionState, useState, useCallback, useEffect } from "react";
import { createUser, updateUser, deleteUser } from "@/app/actions/admin";
import type { AdminFormState } from "@/app/actions/admin";
import { getAllTenants, getUserTenantIds } from "@/app/actions/tenant";
import type { Tenant } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { sanitizeInput, formatDate } from "@/lib/utils";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Shield,
  User,
  Building2,
  X,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const createInitialState: AdminFormState = { message: undefined, errors: {} };

export function UsersTable({ users }: { users: Profile[] }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Profile>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [editingUserTenantIds, setEditingUserTenantIds] = useState<string[]>([]);

  const [createState, createAction, isCreating] = useActionState(
    createUser,
    createInitialState
  );
  const [updateState, updateAction, isUpdating] = useActionState(
    updateUser,
    createInitialState
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteUser,
    createInitialState
  );

  useEffect(() => {
    getAllTenants().then(setAllTenants);
  }, []);

  const handleEditUser = useCallback(async (user: Profile) => {
    const ids = await getUserTenantIds(user.id);
    setEditingUserTenantIds(ids);
    setEditingUser(user);
  }, []);

  const handleSort = useCallback(
    (key: keyof Profile) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortKey] ?? "";
    const bVal = b[sortKey] ?? "";
    const cmp = String(aVal).localeCompare(String(bVal));
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários ({users.length})
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Buscar usuários..."
                  value={search}
                  onChange={(e) => setSearch(sanitizeInput(e.target.value))}
                  className="pl-8"
                />
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  {(
                    [
                      { key: "name", label: "Nome" },
                      { key: "email", label: "Email" },
                      { key: "role", label: "Papel" },
                      { key: "created_at", label: "Criado em" },
                    ] as const
                  ).map((col) => (
                    <th
                      key={col.key}
                      className="cursor-pointer px-3 py-3 font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key &&
                          (sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {sorted.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                          {((user.name && user.name[0]) ||
                            (user.email && user.email[0]) ||
                            "?"
                          ).toUpperCase()}
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">
                          {user.name || "Sem nome"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {user.email}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        }`}
                      >
                        {user.role === "admin" ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        {user.role === "admin" ? "Admin" : "Usuário"}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                          aria-label={`Editar ${user.name || user.email}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingUser(user)}
                          aria-label={`Excluir ${user.name || user.email}`}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-12 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      {search
                        ? "Nenhum usuário encontrado."
                        : "Nenhum usuário cadastrado."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showCreateDialog && (
        <UserFormDialog
          title="Criar usuário"
          state={createState}
          action={createAction}
          isPending={isCreating}
          onClose={() => setShowCreateDialog(false)}
          fields={["name", "email", "password", "role", "tenants"]}
          tenants={allTenants}
        />
      )}

      {editingUser && (
        <UserFormDialog
          title="Editar usuário"
          state={updateState}
          action={updateAction}
          isPending={isUpdating}
          onClose={() => setEditingUser(null)}
          fields={["name", "role", "tenants"]}
          defaultValues={{
            userId: editingUser.id,
            name: editingUser.name,
            email: editingUser.email,
            role: editingUser.role,
          }}
          tenants={allTenants}
          selectedTenantIds={editingUserTenantIds}
        />
      )}

      <AlertDialog
        open={!!deletingUser}
        onOpenChange={(open) => {
          if (!open) setDeletingUser(null);
        }}
      >
        {deletingUser && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir permanentemente{" "}
                <strong className="text-zinc-900 dark:text-zinc-50">
                  {deletingUser.name || deletingUser.email}
                </strong>
                ? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {deleteState.message && (
              <div
                className={`mb-3 rounded-md p-3 text-sm ${
                  deleteState.success
                    ? "border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "border border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300"
                }`}
              >
                {deleteState.message}
              </div>
            )}

            <form action={deleteAction}>
              <input type="hidden" name="userId" value={deletingUser.id} />
              <AlertDialogFooter>
                <AlertDialogCancel />
                <Button
                  type="submit"
                  variant="destructive"
                  isLoading={isDeleting}
                >
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

interface UserFormDialogProps {
  title: string;
  state: AdminFormState;
  action: (payload: FormData) => void;
  isPending: boolean;
  onClose: () => void;
  fields: Array<"name" | "email" | "password" | "role" | "tenants">;
  defaultValues?: {
    userId?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  tenants?: Tenant[];
  selectedTenantIds?: string[];
}

function UserFormDialog({
  title,
  state,
  action,
  isPending,
  onClose,
  fields,
  defaultValues,
  tenants = [],
  selectedTenantIds = [],
}: UserFormDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={action} className="space-y-4">
          {defaultValues?.userId && (
            <input type="hidden" name="userId" value={defaultValues.userId} />
          )}

          {fields.includes("name") && (
            <div className="space-y-1.5">
              <Label htmlFor="dialog-name">Nome</Label>
              <Input
                id="dialog-name"
                name="name"
                placeholder="Nome completo"
                defaultValue={defaultValues?.name}
                required
                onChange={(e) => {
                  e.target.value = sanitizeInput(e.target.value);
                }}
              />
              {state.errors?.name && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {state.errors.name[0]}
                </p>
              )}
            </div>
          )}

          {fields.includes("email") && (
            <div className="space-y-1.5">
              <Label htmlFor="dialog-email">Email</Label>
              <Input
                id="dialog-email"
                name="email"
                type="email"
                placeholder="email@exemplo.com"
                defaultValue={defaultValues?.email}
                required
                onChange={(e) => {
                  e.target.value = sanitizeInput(e.target.value);
                }}
              />
              {state.errors?.email && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {state.errors.email[0]}
                </p>
              )}
            </div>
          )}

          {fields.includes("password") && (
            <div className="space-y-1.5">
              <Label htmlFor="dialog-password">Senha</Label>
              <PasswordInput
                id="dialog-password"
                name="password"
                placeholder="Mínimo 8 caracteres"
                required
              />
              {state.errors?.password && (
                <div className="space-y-0.5">
                  {state.errors.password.map((err) => (
                    <p
                      key={err}
                      className="text-sm text-red-600 dark:text-red-400"
                    >
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {fields.includes("role") && (
            <div className="space-y-1.5">
              <Label htmlFor="dialog-role">Papel</Label>
              <select
                id="dialog-role"
                name="role"
                defaultValue={defaultValues?.role || "user"}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              >
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
              {state.errors?.role && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {state.errors.role[0]}
                </p>
              )}
            </div>
          )}

          {fields.includes("tenants") && tenants.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Empresas
              </Label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
                {tenants.map((tenant) => (
                  <Checkbox
                    key={tenant.id}
                    id={`tenant-${tenant.id}`}
                    name="tenantIds"
                    value={tenant.id}
                    label={tenant.name}
                    defaultChecked={selectedTenantIds.includes(tenant.id)}
                  />
                ))}
                {tenants.length === 0 && (
                  <p className="text-xs text-zinc-400">Nenhuma empresa disponível.</p>
                )}
              </div>
            </div>
          )}

          {state.message && (
            <div
              className={`rounded-md p-3 text-sm ${
                state.success
                  ? "border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "border border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300"
              }`}
            >
              {state.message}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isPending}>
              <Check className="h-4 w-4" />
              {title === "Criar usuário" ? "Criar" : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
